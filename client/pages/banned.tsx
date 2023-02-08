import getConfig from "next/config";
import Link from "next/link";
import React from "react";

import AppWrapper from "../components/AppWrapper";
import { H2, H4, Span } from "../components/Text";
import Footer from "../components/Footer";
import ALink from "../components/ALink";
import { Col } from "../components/Layout";

const { publicRuntimeConfig } = getConfig();

const BannedPage = () => {
  return (
    <AppWrapper>
      <Col flex="1 1 100%" alignItems="center">
        <H2 textAlign="center" my={3} normal>
          {"A link eltávolításra került, mert "}
          <Span style={{ borderBottom: "1px dotted rgba(0, 0, 0, 0.4)" }} bold>
            {"malware-t vagy spam-et tartalmazott!"}
          </Span>
          .
        </H2>
        <H4 textAlign="center" normal>
          {"Ha a "}
          {publicRuntimeConfig.SITE_NAME}{" által rövidített linken spam-et vagy malware-t találsz, "}
          <Link href="/report">
            <ALink title="Send report">{"Küldj nekünk bejelentést!"}</ALink>
          </Link>
          .
        </H4>
      </Col>
      <Footer />
    </AppWrapper>
  );
};

export default BannedPage;
