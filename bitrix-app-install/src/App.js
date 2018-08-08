/* global BX24 window */
import React, { Component } from "react";
import {Button, Input, Switch} from "antd";
import {
  CONTACT_CARD,
  CONTACT_CONTEXT,
  ENTITY_ADD,
  ENTITY_ITEM_ADD,
  ENTITY_ITEM_PROPERTY_ADD,
  getEntityData,
  LEAD_CARD,
  LEAD_CONTEXT,
  NEW_STORAGE,
  SMS_API_KEY,
  SMS_AUTH_KEY,
  USER_ADMINISTRATOR_ID,
  USER_ADMINISTRATOR_NAME
} from "./defaults";
import {
  getUsers,
  handleBindPlacement,
  handleUnbindPlacement,
  notify
} from "./actions";
import { SelectComponent } from "./Select";

export default class App extends Component {
  state = {
    contactCard: false,
    contactContext: false,
    leadCard: false,
    leadContext: false,
    selectedUserId: "",
    smsApiKey: "",
    smsAuthKey: "",
    users: []
  };

  componentDidMount() {
    BX24.init(() => {
      getUsers()
        .then(users => {
          this.setState({ users });
        })
        .catch(err => notify(err));
    });
  }

  finishInstallation = () => {
    let batch = [];
    const userAdministrator = this.state.users.filter(item => {
      return item.id === this.state.selectedUserId;
    })[0];
    /* готовим значения для записи в хранилище */
    const VALUES = {
      isContactCardLinkEnabled: String(this.state.contactCard),
      isContactContextLinkEnabled: String(this.state.contactContext),
      isLeadCardLinkEnabled: String(this.state.leadCard),
      isLeadContextLinkEnabled: String(this.state.leadContext),
      smsApiKey: String(this.state.smsApiKey),
      smsAuthKey: String(this.state.smsAuthKey),
      userAdministratorId: String(this.state.selectedUserId),
      userAdministratorName: String(userAdministrator.name)
    };
    /* добавляем хранилище */
    batch.push([ENTITY_ADD, NEW_STORAGE]);
    /* добавляем свойства объекта хранилища  */
    batch.push([ENTITY_ITEM_PROPERTY_ADD, CONTACT_CARD]);
    batch.push([ENTITY_ITEM_PROPERTY_ADD, CONTACT_CONTEXT]);
    batch.push([ENTITY_ITEM_PROPERTY_ADD, LEAD_CARD]);
    batch.push([ENTITY_ITEM_PROPERTY_ADD, LEAD_CONTEXT]);
    batch.push([ENTITY_ITEM_PROPERTY_ADD, SMS_API_KEY]);
    batch.push([ENTITY_ITEM_PROPERTY_ADD, SMS_AUTH_KEY]);
    batch.push([ENTITY_ITEM_PROPERTY_ADD, USER_ADMINISTRATOR_ID]);
    batch.push([ENTITY_ITEM_PROPERTY_ADD, USER_ADMINISTRATOR_NAME]);
    /* добавляем значения */
    batch.push([ENTITY_ITEM_ADD, getEntityData(VALUES)]);
    BX24.callBatch(batch, () => {
      BX24.callMethod(
        "entity.item.get",
        {
          ENTITY: "settings"
        },
        result => {
          if (result.error()) {
            notify("Ошибка сохранения параметров приложения!");
          } else {
            notify("Параметры приложения успешно сохранены!");
            BX24.installFinish();
          }
        }
      );
    });
  };

  /**
   * @param { string } key
   * @param { string } placement
   * @param { boolean } value
   * @return { void }
   */
  onChange = (value, key, placement) => {
    if (value) {
      handleBindPlacement(placement, window.origin)
        .then(result => {
          notify(result);
          this.setState({ [key]: true });
        })
        .catch(err => {
          notify(err);
          this.setState({ [key]: this.setState[key] });
        });
    } else {
      handleUnbindPlacement(placement, window.origin)
        .then(result => {
          notify(result);
          this.setState({ [key]: false });
        })
        .catch(err => {
          notify(err);
          this.setState({ [key]: this.setState[key] });
        });
    }
  };

  handleUpdate = value => {
    this.setState({ selectedUserId: value });
  };

  render() {
    const {
      contactCard,
      contactContext,
      leadCard,
      leadContext,
      selectedUserId,
      smsApiKey,
      smsAuthKey,
      users
    } = this.state;

    return (
      <div style={{ padding: "1em" }}>
        <h2>Установка приложения.</h2>
        <div style={{ marginBottom: "1em" }}>
          <Switch
            checked={leadContext}
            onChange={checked =>
              this.onChange(checked, "leadContext", "CRM_LEAD_LIST_MENU")
            }
          />{" "}
          Добавить ссылку на приложение в контекстное меню лида.
        </div>
        <div style={{ marginBottom: "1em" }}>
          <Switch
            checked={leadCard}
            onChange={checked =>
              this.onChange(checked, "leadCard", "CRM_LEAD_DETAIL_TAB")
            }
          />{" "}
          Добавить ссылку на приложение в карточку лида.
        </div>
        <div style={{ marginBottom: "1em" }}>
          <Switch
            checked={contactContext}
            onChange={checked =>
              this.onChange(checked, "contactContext", "CRM_CONTACT_LIST_MENU")
            }
          />{" "}
          Добавить ссылку на приложение в контекстное меню контакта.
        </div>
        <div style={{ marginBottom: "1em" }}>
          <Switch
            checked={contactCard}
            onChange={checked =>
              this.onChange(checked, "contactCard", "CRM_CONTACT_DETAIL_TAB")
            }
          />{" "}
          Добавить ссылку на приложение в карточку контакта.
        </div>
        <div style={{ marginBottom: "1em" }}>
          <b>Администратор:</b>
          <SelectComponent
            update={this.handleUpdate}
            users={users}
            value={selectedUserId}
          />
        </div>
        <div style={{ marginBottom: "1em" }}>
          <b>SMS API KEY:</b>
          <Input
            value={smsApiKey}
            onChange={e => this.setState({ smsApiKey: e.target.value })}
          />
        </div>
        <div style={{ marginBottom: "1em" }}>
          <b>SMS AUTH KEY:</b>
          <Input
            value={smsAuthKey}
            onChange={e => this.setState({ smsAuthKey: e.target.value })}
          />
        </div>
        <Button type="primary" onClick={this.finishInstallation}>
          Завершить!
        </Button>
      </div>
    );
  }
}
