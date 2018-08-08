import React from "react";
import { bool, func } from "prop-types";
import { Switch } from "antd";
import { Aux } from "./Utils";

export const Switchers = ({
  contactCard,
  contactContext,
  leadCard,
  leadContext,
  onChange
}) => {
  return (
    <Aux>
      <div style={{ marginBottom: "1em" }}>
        <Switch
          checked={leadContext}
          onChange={checked =>
            onChange(checked, "leadContext", "CRM_LEAD_LIST_MENU")
          }
        />{" "}
        Добавить ссылку на приложение в контекстное меню лида.
      </div>
      <div style={{ marginBottom: "1em" }}>
        <Switch
          checked={leadCard}
          onChange={checked =>
            onChange(checked, "leadCard", "CRM_LEAD_DETAIL_TAB")
          }
        />{" "}
        Добавить ссылку на приложение в карточку лида.
      </div>
      <div style={{ marginBottom: "1em" }}>
        <Switch
          checked={contactContext}
          onChange={checked =>
            onChange(checked, "contactContext", "CRM_CONTACT_LIST_MENU")
          }
        />{" "}
        Добавить ссылку на приложение в контекстное меню контакта.
      </div>
      <div style={{ marginBottom: "1em" }}>
        <Switch
          checked={contactCard}
          onChange={checked =>
            onChange(checked, "contactCard", "CRM_CONTACT_DETAIL_TAB")
          }
        />{" "}
        Добавить ссылку на приложение в карточку контакта.
      </div>
    </Aux>
  );
};

Switchers.propTypes = {
  contactCard: bool.isRequired,
  contactContext: bool.isRequired,
  leadCard: bool.isRequired,
  leadContext: bool.isRequired,
  onChange: func.isRequired
};

Switchers.defaultProps = {
  contactCard: false,
  contactContext: false,
  leadCard: false,
  leadContext: false,
  onChange: () => console.log("Prop 'onChange' is not a Function!")
};
