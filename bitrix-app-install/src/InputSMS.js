import React from "react";
import { func, string } from "prop-types";
import { Input } from "antd";
import { Aux } from "./Utils";

export const InputSMS = ({ apiKey, authKey, update }) => {
  return (
    <Aux>
      <div style={{ marginBottom: "1em" }}>
        <b>SMS API KEY:</b>
        <Input
          value={apiKey}
          onChange={e => update(e.target.value, "smsApiKey")}
        />
      </div>
      <div style={{ marginBottom: "1em" }}>
        <b>SMS AUTH KEY:</b>
        <Input
          value={authKey}
          onChange={e => update(e.target.value, "smsAuthKey")}
        />
      </div>
    </Aux>
  );
};

InputSMS.propTypes = {
  apiKey: string,
  authKey: string,
  update: func.isRequired
};

InputSMS.defaultProps = {
  apiKey: "",
  authKey: "",
  update: () => console.log("Prop 'update' is not a Function!")
};
