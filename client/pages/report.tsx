import { useFormState } from "react-use-form-state";
import { Flex } from "reflexbox/styled-components";
import React, { useState } from "react";
import axios from "axios";

import Text, { H2, Span } from "../components/Text";
import AppWrapper from "../components/AppWrapper";
import { TextInput } from "../components/Input";
import { Button } from "../components/Button";
import { Col } from "../components/Layout";
import Icon from "../components/Icon";
import { useMessage } from "../hooks";
import { APIv2 } from "../consts";

import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

const ReportPage = () => {
  const [formState, { text }] = useFormState<{ url: string }>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useMessage(5000);

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage();
    try {
      await axios.post(`${APIv2.Links}/report`, { link: formState.values.url });
      setMessage("Köszönjük a bejelentés, hamarosan megtesszük a megfelelő lépéseket", "green");
      formState.clear();
    } catch (error) {
      setMessage(error?.response?.data?.error || "Nem tudtam elküldeni a bejelentést!");
    }

    setLoading(false);
  };

  return (
    <AppWrapper>
      <Col width={600} maxWidth="97%" alignItems="flex-start">
        <H2 my={3} bold>
          {"Jelentsd a visszaélést"}
        </H2>
        <Text mb={3}>
          {"Jelentsd be a visszaélést, malware-t, adatlopást célzó linket az alábbi email címen, vagy használd hozzá az itt megjelenő űrlapot. A bejelentést rövidesen megvizsgáljuk"}
        </Text>
        <Text mb={4}>
          {(publicRuntimeConfig.REPORT_EMAIL || "").replace("@", "[at]")}
        </Text>
        <Text mb={3}>
          <Span bold>{"A káros URL:"}</Span>
        </Text>
        <Flex
          as="form"
          flexDirection={["column", "row"]}
          alignItems={["flex-start", "center"]}
          justifyContent="flex-start"
          onSubmit={onSubmit}
        >
          <TextInput
            {...text("url")}
            placeholder={`${publicRuntimeConfig.DEFAULT_DOMAIN}/example`}
            height={[44, 54]}
            width={[1, 1 / 2]}
            flex="0 0 auto"
            mr={3}
            required
          />
          <Button type="submit" flex="0 0 auto" height={[40, 44]} mt={[3, 0]}>
            {loading && <Icon name={"spinner"} stroke="white" mr={2} />}
            {"Bejelentés"}
          </Button>
        </Flex>
        <Text fontSize={14} mt={3} color={message.color}>
          {message.text}
        </Text>
      </Col>
    </AppWrapper>
  );
};

export default ReportPage;
