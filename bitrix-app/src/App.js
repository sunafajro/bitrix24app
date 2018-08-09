import React, { Component } from "react";
import { appInit, getAppParams, getUsers } from "./Actions";
import Registry from "./Registry";
import Settings from "./Settings";
import { Aux, isArrayNotEmpty, notify } from "./Utils";

export default class App extends Component {
  state = {
    current: "registry",
    params: {
      administrator: {},
      smsKeys: {},
      users: []
    }
  };

  componentDidMount() {
    appInit().then(() => {
      getAppParams()
        .then(params => {
          getUsers()
            .then(users => {
              params.users = [...users];
              if (isArrayNotEmpty(users))
                notify("Не найдено ни одного пользователя!");
              this.setState({ params });
            })
            .catch(() => notify("Ошибка получения пользователей!"));
        })
        .catch(() => notify("Ошибка получения параметров приложения!"));
    });
  }

  switchMode = current => {
    this.setState({ current });
  };

  render() {
    const { current, params } = this.state;
    return (
      <Aux>
        {current === "registry" ? (
          <Registry params={params} switchMode={this.switchMode} />
        ) : null}
        {current === "settings" ? (
          <Settings params={params} switchMode={this.switchMode} />
        ) : null}
      </Aux>
    );
  }
}
