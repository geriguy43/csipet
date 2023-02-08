import React from "react";
import { Flex } from "rebass/styled-components";

import FeaturesItem from "./FeaturesItem";
import { ColCenterH } from "./Layout";
import { Colors } from "../consts";
import { H3 } from "./Text";

const Features = () => (
  <ColCenterH
    width={1}
    flex="0 0 auto"
    py={[64, 100]}
    backgroundColor={Colors.FeaturesBg}
  >
    <H3 fontSize={[26, 28]} mb={72} mx={15} light>
      {"Újdonság! Küldj AES256 titkosítású, önmegsemmisülő üzenetet vagy fájlt 2 MB-ig"}<br/>
      
      
    </H3>
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
      <FeaturesItem title="Ingyenes" icon="heart">
        {"Teljesen ingyenes, reklámmentes és az is marad!"}
      </FeaturesItem>
    </Flex>
  </ColCenterH>
);

export default Features;
