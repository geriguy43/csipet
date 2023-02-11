import React from "react";
import { Flex } from "rebass/styled-components";
import ALink from "../components/ALink";
import FeaturesItem from "./FeaturesItem";
import { ColCenterH } from "./Layout";
import { Colors } from "../consts";
import { H3, H4 } from "./Text";

const Features = () => (
  <ColCenterH
    width={1}
    flex="0 0 auto"
    py={[64, 100]}
    backgroundColor={Colors.FeaturesBg}
  >
    <H3 textAlign="center" fontSize={[26, 28]} mb={12} mx={15} light>
      {"Új! TITOK.CSI.PET - Küldj AES256 titkosítású, önmegsemmisülő üzenetet vagy fájlt 10 MB-ig"}
    </H3>
    <H4 textAlign="center" fontSize={[26, 28]} mb={82} mx={15} light>
          <ALink href="https://titok.csi.pet" title="titok.csi.pet" isNextLink>
          KIPRÓBÁLOM!
          </ALink>
    </H4>
    <Flex
      width={1200}
      maxWidth="100%"
      flex="1 1 auto"
      justifyContent="center"
      flexWrap={["wrap", "wrap", "wrap", "nowrap"]}
    >
      <FeaturesItem title="Linkek kezelése" icon="edit">
        {"Rövidítsd linkjeidet, nézd meg, hányan és honnan kattintottak rájuk."}
      </FeaturesItem>
      <FeaturesItem title="Egyedi URL, QR kód" icon="shuffle">
        {"Linkek jelszavas védelme, lejárati idő beállítása, leírás megadása."}
      </FeaturesItem>
      <FeaturesItem title="Van már fiókod?" icon="zap">
        {"Regisztrálj, hogy elérd a speciális funkciókat."}
      </FeaturesItem>
      <FeaturesItem title="Ingyenes, biztonságos" icon="heart">
        {"A szolgáltatás teljesen ingyenes. A káros linkeket Google Safe Browsing scripttel és manuálisan is szűrjük!"}
      </FeaturesItem>
    </Flex>
  </ColCenterH>
);

export default Features;
