import React from "react";
import { array, func, string } from "prop-types";
import Select from "antd/lib/select";

const Option = Select.Option;
const STYLE = { width: "100%", marginRight: "0.5em" };

export const SelectComponent = ({ update, users, value }) => {
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
    <Select
      defaultValue="-select-"
      disabled={users.length ? false : true}
      onChange={val => update(val)}
      style={STYLE}
      value={value}
    >
      {userOptions}
    </Select>
  );
};

SelectComponent.propTypes = {
  update: func.isRequired,
  users: array.isRequired,
  value: string.isRequired
};

SelectComponent.defaultProps = {
  update: () => {},
  users: [],
  value: ""
};
