import React from "react";
import styled from "styled-components";
import { Flex } from "reflexbox/styled-components";

import FeaturesItem from "./FeaturesItem";
import { ColCenterH } from "./Layout";
import { Colors } from "../consts";
import Text, { H3 } from "./Text";

const Features = () => (
  <ColCenterH
    width={1}
    flex="0 0 auto"
    py={[64, 100]}
    backgroundColor={Colors.FeaturesBg}
  >
    <H3 fontSize={[26, 28]} mb={72} mx={15} light>
      {"Bónusz! rövidített linkedet a CSI.RIP előtaggal is eléred. Például a csi.pet/xyz helyett használhatod a csi.rip/xyz formulát is."}
    </H3>
    <Flex
      width={1200}
      maxWidth="100%"
      flex="1 1 auto"
      justifyContent="center"
      flexWrap={["wrap", "wrap", "wrap", "nowrap"]}
    >
      <FeaturesItem title="Linkek kezelése" icon="edit">
        {"Rövidítsd linkjeidet, nézd meg, hányan kattintottak rájuk."}
      </FeaturesItem>
      <FeaturesItem title="Több domain" icon="shuffle">
        {"Több domain közül választhatssz. csi.pet/linked vagy csi.rip/linked"}
      </FeaturesItem>
      <FeaturesItem title="Van már fiókod?" icon="zap">
        {"Regisztrálj, hogy elérd a speciális funkciókat!"}
      </FeaturesItem>
      <FeaturesItem title="Ingyenes" icon="heart">
        {"Teljesen ingyenes és az is marad!"}
      </FeaturesItem>
    </Flex>
  </ColCenterH>
);

export default Features;
