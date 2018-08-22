import React, { Component } from "react";
import { cloneDeep } from "lodash";
import { Spin } from "antd";
import { defaultParams } from "./defaults.js";
import { appInit, getAppParams, getUsers } from "./Actions";
import Registry from "./Registry";
import Settings from "./Settings";
import { Aux, notify } from "./Utils";

export default class App extends Component {
  state = {
    current: "registry",
    loading: true,
    params: cloneDeep(defaultParams)
  };

  componentDidMount() {
    appInit().then(() => {
      getAppParams()
        .then(params => {
          getUsers()
            .then(users => {
              if (Array.isArray(users) && users.length) {
                params.users = cloneDeep(users);
              } else {
                notify("Не найдено ни одного пользователя!");
              }
              this.setState({ loading: false, params });
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
    const { current, loading, params } = this.state;
    if (loading) {
      return <Spin />;
    }
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
