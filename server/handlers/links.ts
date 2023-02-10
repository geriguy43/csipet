import { Handler } from "express";
import { promisify } from "util";
import bcrypt from "bcryptjs";
import isbot from "isbot";
import next from "next";
import URL from "url";
import dns from "dns";

import * as validators from "./validators";
import { CreateLinkReq } from "./types";
import { CustomError } from "../utils";
import transporter from "../mail/mail";
import * as utils from "../utils";
import query from "../queries";
import queue from "../queues";
import env from "../env";

const dnsLookup = promisify(dns.lookup);

export const get: Handler = async (req, res) => {
  const { limit, skip, all } = req.context;
  const search = req.query.search as string;
  const userId = req.user.id;

  const match = {
    ...(!all && { user_id: userId })
  };

  const [links, total] = await Promise.all([
    query.link.get(match, { limit, search, skip }),
    query.link.total(match, { search })
  ]);

  const data = links.map(utils.sanitize.link);

  return res.send({
    total,
    limit,
    skip,
    data
  });
};

export const create: Handler = async (req: CreateLinkReq, res) => {
  const {
    reuse,
    password,
    customurl,
    description,
    target,
    domain,
    expire_in
  } = req.body;
  const domain_id = domain ? domain.id : null;

  const targetDomain = utils.removeWww(URL.parse(target).hostname);

  const queries = await Promise.all([
    validators.cooldown(req.user),
    validators.malware(req.user, target),
    validators.linksCount(req.user),
    reuse &&
      query.link.find({
        target,
        user_id: req.user.id,
        domain_id
      }),
    customurl &&
        query.link.find(
        {
          address: customurl,
          domain_id
        },
        utils.isDefaultDomain(req.headers.host)
      ),
    !customurl &&
      utils.generateId(domain_id, utils.isDefaultDomain(req.headers.host)),
    validators.bannedDomain(targetDomain),
    validators.bannedHost(targetDomain)
  ]);

  // if "reuse" is true, try to return
  // the existent URL without creating one
  if (queries[3]) {
    return res.json(utils.sanitize.link(queries[3]));
  }

  // Check if custom link already exists
  if (queries[4]) {
    throw new CustomError("Ez az egyedi URL már használatban van!");
  }

  // Create new link
  const address = customurl || queries[5];
  const link = await query.link.create({
    password,
    address,
    domain_id,
    description,
    target,
    expire_in,
    user_id: req.user && req.user.id
  });

  if (!req.user && env.NON_USER_COOLDOWN) {
    query.ip.add(req.realIP);
  }

  return res
    .status(201)
    .send(utils.sanitize.link({ ...link, domain: domain?.address }));
};

export const edit: Handler = async (req, res) => {
  const { address, target, description, expire_in, password } = req.body;
  if (!address && !target) {
    throw new CustomError("Legalább egy mezőt szerkesztened kell!");
  }

  const link = await query.link.find({
    uuid: req.params.id,
    ...(!req.user.admin && { user_id: req.user.id })
  });

  if (!link) {
    throw new CustomError("A link nem található");
  }

  const targetDomain = utils.removeWww(URL.parse(target).hostname);
  const domain_id = link.domain_id || null;

  const queries = await Promise.all([
    validators.cooldown(req.user),
    validators.malware(req.user, target),
    address !== link.address &&
      query.link.find({
        address,
        domain_id
      }),
    validators.bannedDomain(targetDomain),
    validators.bannedHost(targetDomain)
  ]);

  // Check if custom link already exists
  if (queries[2]) {
    throw new CustomError("Ez az egyedi URL már használatban van.");
  }

  // Update link
  const [updatedLink] = await query.link.update(
    {
      id: link.id
    },
    {
      ...(address && { address }),
      ...(description && { description }),
      ...(target && { target }),
      ...(expire_in && { expire_in }),
      ...(password && { password })
    }
  );

  return res.status(200).send(utils.sanitize.link({ ...link, ...updatedLink }));
};

export const remove: Handler = async (req, res) => {
  const link = await query.link.remove({
    uuid: req.params.id,
    ...(!req.user.admin && { user_id: req.user.id })
  });

  if (!link) {
    throw new CustomError("Ez a link nem törölhető.");
  }

  return res
    .status(200)
    .send({ message: "A link sikeresen törlésre került." });
};

export const report: Handler = async (req, res) => {
  const { link } = req.body;

  const mail = await transporter.sendMail({
    from: env.MAIL_FROM || env.MAIL_USER,
    to: env.REPORT_EMAIL,
    subject: "[REPORT]",
    text: link,
    html: link
  });

  if (!mail.accepted.length) {
    throw new CustomError("Jelenleg nem jelenthető be visszaélés, próbáld később vagy levélben.");
  }
  return res
    .status(200)
    .send({ message: "Kösz a jelentést, kivizsgáljuk!" });
};

export const ban: Handler = async (req, res) => {
  const { id } = req.params;

  const update = {
    banned_by_id: req.user.id,
    banned: true
  };

  // 1. Check if link exists
  const link = await query.link.find({ uuid: id });

  if (!link) {
    throw new CustomError("Nem találtam linket", 400);
  }

  if (link.banned) {
    return res.status(200).send({ message: "A link már bannolva van." });
  }

  const tasks = [];

  // 2. Ban link
  tasks.push(query.link.update({ uuid: id }, update));

  const domain = utils.removeWww(URL.parse(link.target).hostname);

  // 3. Ban target's domain
  if (req.body.domain) {
    tasks.push(query.domain.add({ ...update, address: domain }));
  }

  // 4. Ban target's host
  if (req.body.host) {
    const dnsRes = await dnsLookup(domain).catch(() => {
      throw new CustomError("Nem tudtam lekérni a DNS infót.");
    });
    const host = dnsRes?.address;
    tasks.push(query.host.add({ ...update, address: host }));
  }

  // 5. Ban link owner
  if (req.body.user && link.user_id) {
    tasks.push(query.user.update({ id: link.user_id }, update));
  }

  // 6. Ban all of owner's links
  if (req.body.userLinks && link.user_id) {
    tasks.push(query.link.update({ user_id: link.user_id }, update));
  }

  // 7. Wait for all tasks to finish
  await Promise.all(tasks).catch(() => {
    throw new CustomError("Nem tudtam bannolni a bejegyzést.");
  });

  // 8. Send response
  return res.status(200).send({ message: "Link sikeresen bannolva." });
};

export const redirect = (app: ReturnType<typeof next>): Handler => async (
  req,
  res,
  next
) => {
  const isBot = isbot(req.headers["user-agent"]);
  const isPreservedUrl = validators.preservedUrls.some(
    item => item === req.path.replace("/", "")
  );

  if (isPreservedUrl) return next();

  // 1. If custom domain, get domain info
  const host = utils.removeWww(req.headers.host);
  const domain =
    host !== env.DEFAULT_DOMAIN
      ? await query.domain.find({ address: host })
      : null;

  // 2. Get link
  const address = req.params.id.replace("+", "");
  const link = await query.link.find(
    {
      address,
      domain_id: domain ? domain.id : null
    },
    utils.isDefaultDomain(host)
  );

  // 3. When no link, if has domain redirect to domain's homepage
  // otherwise redirect to 404
  if (!link) {
    return res.redirect(302, domain ? domain.homepage : "/404");
  }

  // 4. If link is banned, redirect to banned page.
  if (link.banned) {
    return res.redirect("/banned");
  }

  // 5. Append query string when provided
  if (req.query) {
    const url = URL.parse(link.target, true);
    const linkTargetParams = new URLSearchParams(url.search);

    let added = 0;
    Object.entries(req.query).forEach(([key, value]) => {
      if (typeof value === "string") {
        added++;
        linkTargetParams.append(key, value);
      }
    });

    // toString() encodes original url, decode it back
    if (added) {
      url.search = linkTargetParams.toString();
      link.target = URL.format(url);
    }
  }

  // 6. If wants to see link info, then redirect
  const doesRequestInfo = /.*\+$/gi.test(req.params.id);
  if (doesRequestInfo && !link.password) {
    return app.render(req, res, "/url-info", { target: link.target });
  }

  // 7. If link is protected, redirect to password page
  if (link.password) {
    return res.redirect(`/protected/${link.uuid}`);
  }

  // 8. Create link visit
  if (link.user_id && !isBot) {
    queue.visit.add({
      headers: req.headers,
      realIP: req.realIP,
      referrer: req.get("Referrer"),
      link
    });
  }


  // 9. Redirect to target
  return res.redirect(link.target);
};

export const redirectProtected: Handler = async (req, res) => {
  // 1. Get link
  const uuid = req.params.id;
  const link = await query.link.find({ uuid });

  // 2. Throw error if no link
  if (!link || !link.password) {
    throw new CustomError("Nem találom a linket", 400);
  }

  // 3. Check if password matches
  const matches = await bcrypt.compare(req.body.password, link.password);

  if (!matches) {
    throw new CustomError("A jelszó helytelen", 401);
  }

  // 4. Create visit
  if (link.user_id) {
    queue.visit.add({
      headers: req.headers,
      realIP: req.realIP,
      referrer: req.get("Referrer"),
      link
    });
  }

  // 5. Send target
  return res.status(200).send({ target: link.target });
};

export const redirectCustomDomain: Handler = async (req, res, next) => {
  const { path } = req;
  const host = utils.removeWww(req.headers.host);

  if (host === env.DEFAULT_DOMAIN) {
    return next();
  }

  if (
    path === "/" ||
    validators.preservedUrls
      .filter(l => l !== "url-password")
      .some(item => item === path.replace("/", ""))
  ) {
    const domain = await query.domain.find({ address: host });
    const redirectURL = domain
      ? domain.homepage
      : `https://${env.DEFAULT_DOMAIN + path}`;

    return res.redirect(302, redirectURL);
  }

  return next();
};

export const stats: Handler = async (req, res) => {
  const { user } = req;
  const uuid = req.params.id;

  const link = await query.link.find({
    ...(!user.admin && { user_id: user.id }),
    uuid
  });

  if (!link) {
    throw new CustomError("A link nem található.");
  }

  const stats = await query.visit.find({ link_id: link.id }, link.visit_count);

  if (!stats) {
    throw new CustomError("Nem tölthetőek be a linkrövidítési statisztikák.");
  }

  return res.status(200).send({
    ...stats,
    ...utils.sanitize.link(link)
  });
};
