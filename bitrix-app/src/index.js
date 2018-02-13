import React from "react";
import ReactDOM from "react-dom";
import { LocaleProvider } from "antd";
import Moment from "moment";
import "moment/locale/ru";
import ru from "antd/lib/locale-provider/ru_RU";
import App from "./App";
import "./index.css";

Moment.locale("ru");

ReactDOM.render(
  <LocaleProvider locale={ru}>
    <App />
  </LocaleProvider>,
  document.getElementById("root")
);
