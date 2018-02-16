/* global BX24 */
import React, { Component } from "react";
import { Button, notification, Switch } from "antd";

class App extends Component {
  state = {
    contactContext: false,
    contactCard: false,
    leadContext: false,
    leadCard: false
  };

  componentDidMount() {
    BX24.init(function() {
      // BX24.callMethod('placement.get', (result) => {
      //   console.log(result);
      //   if (result.error()) {
      //     console.log('error fetching placements');
      //   } else {
      //     console.log(result);
      //     const placements = result.data();
      //     console.log(placements);
      //   }
      // });
    });
  }

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
    BX24.installFinish();
  };

  onChange = (value, key, placement) => {
    if (value) {
      this.handleBindPlacement(placement, key);
    } else {
      this.handleUnbindPlacement(placement, key);
    }
  };

  render() {
    const { contactContext, contactCard, leadContext, leadCard } = this.state;
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
        <Button type="primary" onClick={this.finishInstallation}>
          Завершить!
        </Button>
      </div>
    );
  }
}

export default App;
