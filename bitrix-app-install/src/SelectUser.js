import React from "react";
import { array, func, string } from "prop-types";
import { Select } from "antd";

const Option = Select.Option;
const STYLE = { width: "100%", marginRight: "0.5em" };

export const SelectUser = ({ update, users, value }) => {
  let userOptions = [
    <Option key="select-user" value="-select-">
      -выберите пользователя-
    </Option>
  ];

  if (users && users.length) {
    users.forEach(user => {
      userOptions.push(
        <Option key={`opt-${user.id}`} value={user.id}>
          {user.name}
        </Option>
      );
    });
  }

  return (
    <div style={{ marginBottom: "1em" }}>
      <b>Администратор:</b>
      <Select
        defaultValue="-select-"
        disabled={users.length ? false : true}
        onChange={val => update(val, "selectedUserId")}
        style={STYLE}
        value={value}
      >
        {userOptions}
      </Select>
    </div>
  );
};

SelectUser.propTypes = {
  update: func.isRequired,
  users: array.isRequired,
  value: string.isRequired
};

SelectUser.defaultProps = {
  update: () => console.log("Prop 'update' is not a Function!"),
  users: [],
  value: ""
};
