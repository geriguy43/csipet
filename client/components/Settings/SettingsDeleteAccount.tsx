import { useFormState } from "react-use-form-state";
import React, { FC, useState } from "react";
import getConfig from "next/config";
import Router from "next/router";
import axios from "axios";

import { getAxiosConfig } from "../../utils";
import { Col, RowCenterV, RowCenterH } from "../Layout";
import Text, { H2, Span } from "../Text";
import { useMessage } from "../../hooks";
import { TextInput } from "../Input";
import { APIv2, Colors } from "../../consts";
import { Button } from "../Button";
import Icon from "../Icon";
import Modal from "../Modal";

const { publicRuntimeConfig } = getConfig();

const SettingsDeleteAccount: FC = () => {
  const [message, setMessage] = useMessage(1500);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [formState, { password, label }] = useFormState<{ accpass: string }>(
    null,
    {
      withIds: true
    }
  );

  const onSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setModal(true);
  };

  const onDelete = async e => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await axios.post(
        `${APIv2.Users}/delete`,
        { password: formState.values.accpass },
        getAxiosConfig()
      );
      Router.push("/logout");
    } catch (error) {
      setMessage(error.response.data.error);
    }
    setLoading(false);
  };

  return (
    <Col alignItems="flex-start" maxWidth="100%">
      <H2 mb={4} bold>
        {"Fiók törlése"}
      </H2>
      <Text mb={4}>
        {"Fiók törlése a következő oldalról: "} {publicRuntimeConfig.SITE_NAME}.
      </Text>
      <Text
        {...label("password")}
        as="label"
        mb={[2, 3]}
        fontSize={[15, 16]}
        bold
      >
        {"Jelszavad:"}
      </Text>
      <RowCenterV as="form" onSubmit={onSubmit}>
        <TextInput
          {...password("accpass")}
          placeholder="Jelszó..."
          autocomplete="off"
          mr={3}
        />
        <Button color="red" type="submit" disabled={loading}>
          <Icon name={loading ? "spinner" : "trash"} mr={2} stroke="white" />
          {"Törlés"}
        </Button>
      </RowCenterV>
      <Modal
        id="delete-account"
        show={modal}
        closeHandler={() => setModal(false)}
      >
        <>
          <H2 mb={24} textAlign="center" bold>
            {"Biztosan törlöd a fiókod?"}
          </H2>
          <Text textAlign="center">
            {"Összes adatod, - beleértve a "}<Span bold>linkeket</Span>{" és a"}
            <Span bold>statokat</Span>{" - törlésre kerülnek."}
          </Text>
          <RowCenterH mt={44}>
            {loading ? (
              <>
                <Icon name="spinner" size={20} stroke={Colors.Spinner} />
              </>
            ) : message.text ? (
              <Text fontSize={15} color={message.color}>
                {message.text}
              </Text>
            ) : (
              <>
                <Button color="gray" mr={3} onClick={() => setModal(false)}>
                  {"Mégse"}
                </Button>
                <Button color="red" ml={3} onClick={onDelete}>
                  <Icon name="trash" stroke="white" mr={2} />
                  {"Törlés"}
                </Button>
              </>
            )}
          </RowCenterH>
        </>
      </Modal>
    </Col>
  );
};

export default SettingsDeleteAccount;
