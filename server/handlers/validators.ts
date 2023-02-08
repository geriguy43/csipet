import { body, param } from "express-validator";
import { isAfter, subDays, subHours, addMilliseconds } from "date-fns";
import urlRegex from "url-regex";
import { promisify } from "util";
import bcrypt from "bcryptjs";
import axios from "axios";
import dns from "dns";
import URL from "url";
import ms from "ms";

import { CustomError, addProtocol, removeWww } from "../utils";
import query from "../queries";
import knex from "../knex";
import env from "../env";

const dnsLookup = promisify(dns.lookup);

export const preservedUrls = [
  "login",
  "logout",
  "signup",
  "reset-password",
  "resetpassword",
  "url-password",
  "url-info",
  "settings",
  "stats",
  "verify",
  "api",
  "404",
  "static",
  "images",
  "banned",
  "terms",
  "privacy",
  "protected",
  "report",
  "pricing"
];

export const checkUser = (value, { req }) => !!req.user;

export const createLink = [
  body("target")
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("Target is missing.")
    .isString()
    .trim()
    .isLength({ min: 1, max: 2040 })
    .withMessage("Max URL hossz: 2400.")
    .customSanitizer(addProtocol)
    .custom(
      value =>
        urlRegex({ exact: true, strict: false }).test(value) ||
        /^(?!https?)(\w+):\/\//.test(value)
    )
    .withMessage("Az URL helytelen.")
    .custom(value => removeWww(URL.parse(value).host) !== env.DEFAULT_DOMAIN)
    .withMessage(`${env.DEFAULT_DOMAIN} URLs are not allowed.`),
  body("password")
    .optional({ nullable: true, checkFalsy: true })
    .custom(checkUser)
    .withMessage("Csak regisztrált felhasználóknak!")
    .isString()
    .isLength({ min: 3, max: 64 })
    .withMessage("3 és 64 karakter közötti jelszót adj meg."),
  body("customurl")
    .optional({ nullable: true, checkFalsy: true })
    .custom(checkUser)
    .withMessage("Csak regisztrált felhasználóknak!")
    .isString()
    .trim()
    .isLength({ min: 1, max: 64 })
    .withMessage("A rövidített URL 1 és 64 karakter közötti hosszúságú lehet.")
    .custom(value => /^[a-zA-Z0-9-_]+$/g.test(value))
    .withMessage("Az egyedi URL helytelen")
    .custom(value => !preservedUrls.some(url => url.toLowerCase() === value))
    .withMessage("Ezt az URL-t nem használhatod"),
  body("reuse")
    .optional({ nullable: true })
    .custom(checkUser)
    .withMessage("Csak regisztrált felhasználóknak!")
    .isBoolean()
    .withMessage("Csak igen/nem!"),
  body("description")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 0, max: 2040 })
    .withMessage("A leírás 0 és 2040 karakter közötti hosszúságú lehet"),
  body("expire_in")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .custom(value => {
      try {
        return !!ms(value);
      } catch {
        return false;
      }
    })
    .withMessage("A lejárati formátum helytelen. Példák: 1m, 8h, 42d")
    .customSanitizer(ms)
    .custom(value => value >= ms("1m"))
    .withMessage("A minimum lejárati idő 1 perc.")
    .customSanitizer(value => addMilliseconds(new Date(), value).toISOString()),
  body("domain")
    .optional({ nullable: true, checkFalsy: true })
    .custom(checkUser)
    .withMessage("Csak regisztrált felhasználóknak!")
    .isString()
    .withMessage("a Domain csak valamely listaelem lehet")
    .customSanitizer(value => value.toLowerCase())
    .customSanitizer(value => removeWww(URL.parse(value).hostname || value))
    .custom(async (address, { req }) => {
      if (address === env.DEFAULT_DOMAIN) {
        req.body.domain = null;
        return;
      }

      const domain = await query.domain.find({
        address,
        user_id: req.user.id
      });
      req.body.domain = domain || null;

      if (!domain) return Promise.reject();
    })
    .withMessage("Ez a domain nem használható.")
];

export const editLink = [
  body("target")
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .trim()
    .isLength({ min: 1, max: 2040 })
    .withMessage("Maximumm URL hossz: 2040.")
    .customSanitizer(addProtocol)
    .custom(
      value =>
        urlRegex({ exact: true, strict: false }).test(value) ||
        /^(?!https?)(\w+):\/\//.test(value)
    )
    .withMessage("Ez az URL érvénytelen")
    .custom(value => removeWww(URL.parse(value).host) !== env.DEFAULT_DOMAIN)
    .withMessage(`${env.DEFAULT_DOMAIN} URLs are not allowed.`),
    body("password")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ min: 3, max: 64 })
    .withMessage("A jelszónak 3 és 64 karakter közötti hosszúságúnak kell lennie."),
  body("address")
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .trim()
    .isLength({ min: 1, max: 64 })
    .withMessage("Az egyedi URL 1 és 64 karakter között lehet.")
    .custom(value => /^[a-zA-Z0-9-_]+$/g.test(value))
    .withMessage("Az egyedi URL helytelen")
    .custom(value => !preservedUrls.some(url => url.toLowerCase() === value))
    .withMessage("Ez az URL nem használható."),
  body("expire_in")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .custom(value => {
      try {
        return !!ms(value);
      } catch {
        return false;
      }
    })
    .withMessage("A lejárati formátum helytelen. Példák: 1m, 8h, 42d")
    .customSanitizer(ms)
    .custom(value => value >= ms("1m"))
    .withMessage("A minimum lejárati idő 1 perc.")
    .customSanitizer(value => addMilliseconds(new Date(), value).toISOString()),
  body("description")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 0, max: 2040 })
    .withMessage("A leírás 0 és 2040 karakter között lehet."),
  param("id", "ID érvénytelen")
    .exists({ checkFalsy: true, checkNull: true })
    .isLength({ min: 36, max: 36 })
];

export const redirectProtected = [
  body("password", "Jelszó érvénytelen")
    .exists({ checkFalsy: true, checkNull: true })
    .isString()
    .isLength({ min: 3, max: 64 })
    .withMessage("A jelszó 3 és 64 karakter közötti hosszúságú lehet."),
  param("id", "ID érvénytelen")
    .exists({ checkFalsy: true, checkNull: true })
    .isLength({ min: 36, max: 36 })
];

export const addDomain = [
  body("address", "A domain helytelen")
    .exists({ checkFalsy: true, checkNull: true })
    .isLength({ min: 3, max: 64 })
    .withMessage("A domain 3 és 64 karakter közötti hosszúságú lehet.")
    .trim()
    .customSanitizer(value => {
      const parsed = URL.parse(value);
      return removeWww(parsed.hostname || parsed.href);
    })
    .custom(value => urlRegex({ exact: true, strict: false }).test(value))
    .custom(value => value !== env.DEFAULT_DOMAIN)
    .withMessage("Az alap domaint nem használhatod.")
    .custom(async value => {
      const domain = await query.domain.find({ address: value });
      if (domain?.user_id || domain?.banned) return Promise.reject();
    })
    .withMessage("Ez a domain nem hozzáadható."),
  body("homepage")
    .optional({ checkFalsy: true, nullable: true })
    .customSanitizer(addProtocol)
    .custom(value => urlRegex({ exact: true, strict: false }).test(value))
    .withMessage("A honlap érvénytelen.")
];

export const removeDomain = [
  param("id", "ID érvénytelen")
    .exists({
      checkFalsy: true,
      checkNull: true
    })
    .isLength({ min: 36, max: 36 })
];

export const deleteLink = [
  param("id", "ID érvénytelen")
    .exists({
      checkFalsy: true,
      checkNull: true
    })
    .isLength({ min: 36, max: 36 })
];

export const reportLink = [
  body("link", "Nincs link biztosítva.")
    .exists({
      checkFalsy: true,
      checkNull: true
    })
    .customSanitizer(addProtocol)
    .custom(
      value => removeWww(URL.parse(value).hostname) === env.DEFAULT_DOMAIN
    )
    .withMessage(`You can only report a ${env.DEFAULT_DOMAIN} link.`)
];

export const banLink = [
  param("id", "ID érvénytelen")
    .exists({
      checkFalsy: true,
      checkNull: true
    })
    .isLength({ min: 36, max: 36 }),
  body("host", '"host" should be a boolean.')
    .optional({
      nullable: true
    })
    .isBoolean(),
  body("user", '"user" should be a boolean.')
    .optional({
      nullable: true
    })
    .isBoolean(),
  body("userlinks", '"userlinks" should be a boolean.')
    .optional({
      nullable: true
    })
    .isBoolean(),
  body("domain", '"domain" should be a boolean.')
    .optional({
      nullable: true
    })
    .isBoolean()
];

export const getStats = [
  param("id", "ID érvénytelen")
    .exists({
      checkFalsy: true,
      checkNull: true
    })
    .isLength({ min: 36, max: 36 })
];

export const signup = [
  body("password", "A jelszó helytelen.")
    .exists({ checkFalsy: true, checkNull: true })
    .isLength({ min: 8, max: 64 })
    .withMessage("A jelszó 8 és 64 karakter közötti hosszúságú lehet."),
  body("email", "Az email cím helytelen.")
    .exists({ checkFalsy: true, checkNull: true })
    .trim()
    .isEmail()
    .isLength({ min: 5, max: 255 })
    .withMessage("az email cím maximum 255 karakter lehet.")
    .custom(async (value, { req }) => {
      const user = await query.user.find({ email: value });

      if (user) {
        req.user = user;
      }

      if (user?.verified) return Promise.reject();
    })
    .withMessage("Ez az email cím nem használható.")
];

export const login = [
  body("password", "A jelszó helytelen.")
    .exists({ checkFalsy: true, checkNull: true })
    .isLength({ min: 8, max: 64 })
    .withMessage("A jelszó 8 és 64 karakter közötti hosszúságú lehet."),
  body("email", "Az email cím helytelen")
    .exists({ checkFalsy: true, checkNull: true })
    .trim()
    .isEmail()
    .isLength({ min: 5, max: 255 })
    .withMessage("Email hossza maximum 255 karakter lehet.")
];

export const changePassword = [
  body("password", "A jelszó helytelen.")
    .exists({ checkFalsy: true, checkNull: true })
    .isLength({ min: 8, max: 64 })
    .withMessage("A jelszó 8 és 64 karakter közötti hosszúságú lehet.")
];

export const resetPasswordRequest = [
  body("email", "Az email cím helytelen")
    .exists({ checkFalsy: true, checkNull: true })
    .trim()
    .isEmail()
    .isLength({ min: 5, max: 255 })
    .withMessage("Email hossza maximum 255 karakter lehet."),
  body("password", "A jelszó helytelen.")
    .exists({ checkFalsy: true, checkNull: true })
    .isLength({ min: 8, max: 64 })
    .withMessage("A jelszó 8 és 64 karakter közötti hosszúságú lehet.")
];

export const resetEmailRequest = [
  body("email", "Az email cím helytelen.")
    .exists({ checkFalsy: true, checkNull: true })
    .trim()
    .isEmail()
    .isLength({ min: 5, max: 255 })
    .withMessage("Email hossza maximum 255 karakter lehet.")
];

export const deleteUser = [
  body("password", "A jelszó helytelen.")
    .exists({ checkFalsy: true, checkNull: true })
    .isLength({ min: 8, max: 64 })
    .custom(async (password, { req }) => {
      const isMatch = await bcrypt.compare(password, req.user.password);
      if (!isMatch) return Promise.reject();
    })
];

export const cooldown = (user: User) => {
  if (!env.GOOGLE_SAFE_BROWSING_KEY || !user || !user.cooldowns) return;

  // If has active cooldown then throw error
  const hasCooldownNow = user.cooldowns.some(cooldown =>
    isAfter(subHours(new Date(), 12), new Date(cooldown))
  );

  if (hasCooldownNow) {
    throw new CustomError("Malware URL beküldése miatt 1 nap pihi!");
  }
};

export const malware = async (user: User, target: string) => {
  if (!env.GOOGLE_SAFE_BROWSING_KEY) return;

  const isMalware = await axios.post(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${env.GOOGLE_SAFE_BROWSING_KEY}`,
    {
      client: {
        clientId: env.DEFAULT_DOMAIN.toLowerCase().replace(".", ""),
        clientVersion: "1.0.0"
      },
      threatInfo: {
        threatTypes: [
          "THREAT_TYPE_UNSPECIFIED",
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION"
        ],
        platformTypes: ["ANY_PLATFORM", "PLATFORM_TYPE_UNSPECIFIED"],
        threatEntryTypes: [
          "EXECUTABLE",
          "URL",
          "THREAT_ENTRY_TYPE_UNSPECIFIED"
        ],
        threatEntries: [{ url: target }]
      }
    }
  );
  if (!isMalware.data || !isMalware.data.matches) return;

  if (user) {
    const [updatedUser] = await query.user.update(
      { id: user.id },
      {
        cooldowns: knex.raw("array_append(cooldowns, ?)", [
          new Date().toISOString()
        ]) as any
      }
    );

    // Ban if too many cooldowns
    if (updatedUser.cooldowns.length > 2) {
      await query.user.update({ id: user.id }, { banned: true });
      throw new CustomError("Túl sok malware. Végleg bannolva...");
    }
  }

  throw new CustomError(
    user ? "Malware-t küldtél be, 1 nap pihi..." : "Malware detected!"
  );
};

export const linksCount = async (user?: User) => {
  if (!user) return;

  const count = await query.link.total({
    user_id: user.id,
    created_at: [">", subDays(new Date(), 1).toISOString()]
  });

  if (count > env.USER_LIMIT_PER_DAY) {
    throw new CustomError(
      `Napi limit... (${env.USER_LIMIT_PER_DAY}). 24h. pihi...`
    );
  }
};

export const bannedDomain = async (domain: string) => {
  const isBanned = await query.domain.find({
    address: domain,
    banned: true
  });

  if (isBanned) {
    throw new CustomError("Az URL malware/scam.", 400);
  }
};

export const bannedHost = async (domain: string) => {
  let isBanned;

  try {
    const dnsRes = await dnsLookup(domain);

    if (!dnsRes || !dnsRes.address) return;

    isBanned = await query.host.find({
      address: dnsRes.address,
      banned: true
    });
  } catch (error) {
    isBanned = null;
  }

  if (isBanned) {
    throw new CustomError("Az URL malware/scam.", 400);
  }
};
