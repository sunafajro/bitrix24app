/* global BX24 */
import React, { Component } from "react";
import Moment from 'moment';
import { Button, notification, Select, Switch } from "antd";

const Option = Select.Option;

class App extends Component {
  state = {
    contactContext: false,
    contactCard: false,
    leadContext: false,
    leadCard: false,
    selectedUserId: "",
    users: []
  };

  componentWillMount() {
    BX24.init(function() {});
  }

  componentDidMount() {
    this.getUsers();
  }

  /* получает список сотрудников */
  getUsers = () => {
    BX24.callMethod("user.get", {}, result => {
      if (result.error()) {
        notification.open({
          duration: 2,
          description: "Ошибка получения пользователей!"
        });
      } else {
        const rawUsers = result.data();
        let users = [];
        if (rawUsers && rawUsers.length) {
          rawUsers.forEach(user => {
            if (user.LAST_NAME) {
              users.push({
                id: user.ID,
                name: user.LAST_NAME + " " + user.NAME
              });
            }
          });
        }
        if (users.length) {
          this.setState({ users });
        } else {
          notification.open({
            duration: 2,
            description: "Не найдено ни одного пользователя!"
          });
        }
      }
    });
  };

  handleBindPlacement = (placement, key) => {
    BX24.callMethod(
      "placement.bind",
      {
        PLACEMENT: placement,
        HANDLER: "https://app.evgenybelkin.ru/index.php",
        TITLE: "Регистратура",
        DESCRIPTION: "Тестовое приложение Регистратура"
      },
      result => {
        if (result.error()) {
          notification.open({
            duration: 2,
            description: "При добавлении элемента произошла ошибка!"
          });
          this.setState({ [key]: this.setState[key] });
        } else {
          notification.open({
            duration: 2,
            description: "Элемент успешно добавлен!"
          });
          this.setState({ [key]: true });
        }
      }
    );
  };

  handleUnbindPlacement = (placement, key) => {
    BX24.callMethod(
      "placement.unbind",
      {
        PLACEMENT: placement,
        HANDLER: "https://app.evgenybelkin.ru/index.php"
      },
      result => {
        if (result.error()) {
          notification.open({
            duration: 2,
            description: "При удалении элемента произошла ошибка!"
          });
          this.setState({ [key]: this.setState[key] });
        } else {
          notification.open({
            duration: 2,
            description: "Элемент успешно удален!"
          });
          this.setState({ [key]: false });
        }
      }
    );
  };

  finishInstallation = () => {
    let batch = [];
    const userAdministrator = this.state.users.filter(item => {
      return item.id === this.state.selectedUserId;
    })[0];
    const VALUES = {
      isContactContextLinkEnabled: this.state.contactContext.toString(),
      isContactCardLinkEnabled: this.state.contactCard.toString(),
      isLeadContextLinkEnabled: this.state.leadContext.toString(),
      isLeadCardLinkEnabled: this.state.leadCard.toString(),
      userAdministratorId: this.state.selectedUserId,
      userAdministratorName: userAdministrator.name.toString(),
    };
    /* добавляем хранилище */
    batch.push([
      "entity.add",
      { ENTITY: "settings", NAME: "Settings", ACCESS: { AU: "W" } }
    ]);
    /* добавляем свойства объекта хранилища  */
    batch.push([
      "entity.item.property.add",
      {
        ENTITY: "settings",
        PROPERTY: "isContactContextLinkEnabled",
        NAME: "Link placed In Contact Context",
        TYPE: "S"
      }
    ]);
    batch.push([
      "entity.item.property.add",
      {
        ENTITY: "settings",
        PROPERTY: "isContactCardLinkEnabled",
        NAME: "Link placed In Contact Card",
        TYPE: "S"
      }
    ]);
    batch.push([
      "entity.item.property.add",
      {
        ENTITY: "settings",
        PROPERTY: "isLeadContextLinkEnabled",
        NAME: "Link placed In Lead Context",
        TYPE: "S"
      }
    ]);
    batch.push([
      "entity.item.property.add",
      {
        ENTITY: "settings",
        PROPERTY: "isLeadCardLinkEnabled",
        NAME: "Link placed In Lead Card",
        TYPE: "S"
      }
    ]);
    batch.push([
      "entity.item.property.add",
      {
        ENTITY: "settings",
        PROPERTY: "userAdministratorId",
        NAME: "User administrator ID",
        TYPE: "S"
      }
    ]);
    batch.push([
      "entity.item.property.add",
      {
        ENTITY: "settings",
        PROPERTY: "userAdministratorName",
        NAME: "User administrator name",
        TYPE: "S"
      }
    ]);
    /* добавляем значения */
    batch.push([
      "entity.item.add",
      {
        ENTITY: "settings",
        DATE_ACTIVE_FROM: Moment().format(),
        NAME: 'App options',
        PROPERTY_VALUES: VALUES,
      }
    ]);
    BX24.callBatch(batch, () => {
      BX24.callMethod("entity.item.get", { ENTITY: "settings" }, result => {
        if (result.error()) {
          notification.open({
            duration: 2,
            description: "Ошибка сохранения параметров приложения!"
          });
        } else {
          notification.open({
            duration: 2,
            description: "Параметры приложения успешно сохранены!"
          });
          BX24.installFinish();
        }
      });
    });
  };

  onChange = (value, key, placement) => {
    if (value) {
      this.handleBindPlacement(placement, key);
    } else {
      this.handleUnbindPlacement(placement, key);
    }
  };

  render() {
    const {
      contactContext,
      contactCard,
      leadContext,
      leadCard,
      selectedUserId,
      users
    } = this.state;
    let userOptions = [
      <Option key="select-user" value="-select-">
        -выберите пользователя-
      </Option>
    ];
    if (users && users.length) {
      users.forEach(user => {
        userOptions.push(
          <Option key={"opt-" + user.id} value={user.id}>
            {user.name}
          </Option>
        );
      });
    }

    const USERS = (
      <Select
        defaultValue="-select-"
        disabled={users.length ? false : true}
        onChange={val => this.setState({ selectedUserId: val })}
        style={{ width: "100%", marginRight: "0.5em" }}
        value={selectedUserId}
      >
        {userOptions}
      </Select>
    );
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
          {USERS}
        </div>
        <Button type="primary" onClick={this.finishInstallation}>
          Завершить!
        </Button>
      </div>
    );
  }
}

export default App;
