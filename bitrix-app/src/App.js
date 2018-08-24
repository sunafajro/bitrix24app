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
    this.startApp();
  }

  startApp = async () => {
    await appInit();
    try {
      const startData = await Promise.all([getAppParams(), getUsers()]);
      const params = startData[0] ? startData[0] : cloneDeep(defaultParams);
      if (Array.isArray(startData[1]) && startData[1].length) {
        params.users = cloneDeep(startData[1]);
      } else {
        notify("Не найдено ни одного пользователя!");
      }
      this.setState({ loading: false, params });
    } catch (e) {
      notify("Ошибка получения первоначальных параметров приложения!");
      console.log(e);
    }
  };

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
