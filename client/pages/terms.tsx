import getConfig from "next/config";
import React from "react";

import AppWrapper from "../components/AppWrapper";
import { Col } from "../components/Layout";

const TermsPage = () => (
  <AppWrapper>
    {/* TODO: better container */}
    <Col width={600} maxWidth="97%" alignItems="flex-start">
      <h3>{"CSI.PET felhasználási feltételek"}</h3>
      <p>{"A CSI.PET weboldalra való belépéssel elfogadod, hogy a jelen szolgáltatási feltételek, az összes alkalmazandó törvény és szabályozás kötelező érvényű, és elfogadod, hogy felelős vagy az alkalmazandó helyi (magyar) törvények betartásáért. Ha nem értesz egyet a jelen feltételek bármelyikével, tilos a webhelyet használnod vagy ahhoz hozzáférned, megnyitnod. A weboldalon található anyagok a vonatkozó szerzői jogi és védjegyjogok védelme alatt állnak."}
      </p>
      <p>
        {"A CSI.PET vagy annak beszállítói semmilyen esetben sem vállalnak felelősséget a CSI.PET weboldalon található anyagok használatából vagy használhatatlanságából eredő károkért (beleértve, de nem kizárólagosan az adatvesztésből vagy nyereségkiesésből, illetve az üzletmenet megszakításából eredő károkat), még akkor sem, ha a CSI.PET-et vagy a CSI.PET felhatalmazott képviselőjét szóban vagy írásban értesítették az ilyen kár lehetőségéről. Mivel egyes joghatóságok nem engedélyezik a hallgatólagos szavatosság korlátozását, illetve a következményes vagy véletlen károkért való felelősség korlátozását, előfordulhat, hogy ezek a korlátozások nem vonatkoznak rád. Ebben az esetben az oldal használata TILOS! A CSI.PET weboldalon megjelenő anyagok technikai, tipográfiai vagy fényképészeti hibákat tartalmazhatnak."}
      </p>
      <p>
        {"A CSI.PET nem szavatolja, hogy a CSI.PET weboldalán található anyagok pontosak, teljesek vagy aktuálisak. A CSI.PET bármikor, előzetes értesítés nélkül módosíthatja a weboldalán található anyagokat. A CSI.PET azonban nem vállal kötelezettséget az anyagok frissítésére."}
      </p>
      <p>
        {"A CSI.PET nem tekintette át a weboldalához kapcsolódó egyik webhelyet sem, és nem vállal felelősséget az ilyen hivatkozott webhelyek tartalmáért. Ezeket a felhasználók generálták. Bármely link megjelenítése nem jelenti azt, hogy a CSI.PET jóváhagyta az adott oldalt. A hivatkozott webhelyek használata a felhasználó saját felelősségére történik."}
      </p>
      <p>
        {"A CSI.PET a jövőben felülvizsgálhatja ezeket a szolgáltatási feltételeket, weboldalának használati feltételeit bármikor, előzetes értesítés nélkül módosíthatja. A weboldal használatával beleegyezel, és elfogadod hogy a jelen felhasználási feltételek mindenkor aktuális verziója kötelező érvényűek rád nézve."}
      </p>
       <p>
        {"A CSI.PET nonprofit, privát fejlesztés, üzemeltetője: Blaskó Gergely. A CSI.PET az open source KUTT projekten alapul. GitHub link a footerben."}
      </p>
    </Col>
  </AppWrapper>
);

export default TermsPage;
