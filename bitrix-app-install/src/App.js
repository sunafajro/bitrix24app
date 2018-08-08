/* global BX24 window */
import React, { Component } from "react";
import { Button } from "antd";
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
  appInit,
  callBatch,
  getEntityItem,
  getUsers,
  handlePlacement,
  placementGet
} from "./Actions";
import { notify } from "./Utils";
import { InputSMS } from "./InputSMS";
import { SelectUser } from "./SelectUser";
import { Switchers } from "./Switchers";

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
    let newStateData = {};
    appInit().then(() => {
      placementGet().then(placements => {
        if (Array.isArray(placements) && placements.length) {
          if (placements.indexOf("CRM_CONTACT_DETAIL_TAB") !== -1) {
            newStateData.contactCard = true;
          }
          if (placements.indexOf("CRM_CONTACT_LIST_MENU") !== -1) {
            newStateData.contactContext = true;
          }
          if (placements.indexOf("CRM_LEAD_DETAIL_TAB") !== -1) {
            newStateData.leadCard = true;
          }
          if (placements.indexOf("CRM_LEAD_LIST_MENU") !== -1) {
            newStateData.leadContext = true;
          }
        }
        getUsers()
          .then(users => {
            if (Array.isArray(users) && users.length) {
              newStateData.users = [...users];
            } else {
              notify("Не найдено ни одного пользователя!");
            }
            if (Object.keys(newStateData).length) {
              this.setState(newStateData);
            }
          })
          .catch(() => {
            notify("Ошибка получения пользователей!");
            if (Object.keys(newStateData).length) {
              this.setState(newStateData);
            }
          });
      });
    });
  }

  finishInstallation = () => {
    let batch = [];
    const userAdministrator = this.state.users.filter(item => {
      return item.id === this.state.selectedUserId;
    })[0];
    /* готовим значения для записи в хранилище */
    const VALUES = getEntityData({
      isContactCardLinkEnabled: String(this.state.contactCard),
      isContactContextLinkEnabled: String(this.state.contactContext),
      isLeadCardLinkEnabled: String(this.state.leadCard),
      isLeadContextLinkEnabled: String(this.state.leadContext),
      smsApiKey: String(this.state.smsApiKey),
      smsAuthKey: String(this.state.smsAuthKey),
      userAdministratorId: String(this.state.selectedUserId),
      userAdministratorName: String(userAdministrator.name)
    });
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
    batch.push([ENTITY_ITEM_ADD, VALUES]);
    callBatch(batch).then(() => {
      getEntityItem()
        .then(() => {
          notify("Параметры приложения успешно сохранены!");
          BX24.installFinish();
        })
        .catch(() => notify("Ошибка сохранения параметров приложения!"));
    });
  };

  /**
   * @param { string } key
   * @param { string } placement
   * @param { boolean } value
   * @return { void }
   */
  onChange = (value, key, placement) => {
    let data = {
      PLACEMENT: placement,
      HANDLER: `${window.origin}/index.php`
    };
    let path = "placement.unbind";
    if (value) {
      data.TITLE = "Регистратура";
      data.DESCRIPTION = "Тестовое приложение Регистратура";
      path = "placement.bind";
    }
    handlePlacement(path, data)
      .then(() => {
        notify(value ? "Элемент добавлен в меню!" : "Элемент удален из меню!");
        this.setState({ [key]: value });
      })
      .catch(() => {
        notify(
          value
            ? "Ошибка добавления элемента в меню!"
            : "Ошибка удаления элемента из меню!"
        );
        this.setState({ [key]: this.setState[key] });
      });
  };

  /**
   * обновляет значение переменной состояния
   * @param { string } key
   * @param { string } value
   * @return { void }
   */
  handleUpdate = (value, key) => {
    this.setState({ [key]: value });
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
        <Switchers
          contactCard={contactCard}
          contactContext={contactContext}
          leadCard={leadCard}
          leadContext={leadContext}
          onChange={this.onChange}
        />
        <SelectUser
          update={this.handleUpdate}
          users={users}
          value={selectedUserId}
        />
        <InputSMS
          apiKey={smsApiKey}
          authKey={smsAuthKey}
          update={this.handleUpdate}
        />
        <Button type="primary" onClick={this.finishInstallation}>
          Завершить!
        </Button>
      </div>
    );
  }
}
