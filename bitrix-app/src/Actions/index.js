/* global BX24 */
import { cloneDeep } from "lodash";
import { defaultParams } from "../defaults";

export const appInit = () => {
  return new Promise((resolve, reject) => {
    BX24.init(() => resolve());
  });
};

/* получает параметры приложения из хранилища */
export const getAppParams = () => {
  return new Promise((resolve, reject) => {
    BX24.callMethod("entity.item.get", { ENTITY: "settings" }, result => {
      if (result.error()) return reject();
      const rawSettings = result.data();
      let params = cloneDeep(defaultParams);
      if (
        Array.isArray(rawSettings) &&
        rawSettings.length &&
        rawSettings[0].hasOwnProperty("PROPERTY_VALUES")
      ) {
        const propVal = rawSettings[0].PROPERTY_VALUES;
        params.administrator.id = propVal.userAdministratorId
          ? propVal.userAdministratorId
          : "";
        params.administrator.name = propVal.userAdministratorName
          ? propVal.userAdministratorName
          : "";
        params.smsKeys.smsApiKey = propVal.smsApiKey ? propVal.smsApiKey : "";
        params.smsKeys.smsAuthKey = propVal.smsAuthKey
          ? propVal.smsAuthKey
          : "";
      }
      return resolve(params);
    });
  });
};

/* получает список сотрудников */
export const getUsers = () => {
  return new Promise((resolve, reject) => {
    BX24.callMethod("user.get", {}, result => {
      if (result.error()) return reject();
      const rawUsers = result.data();
      let users = [];
      if (Array.isArray(rawUsers) && rawUsers.length) {
        users = rawUsers.map(user => {
          return {
            id: user.ID,
            firstName: user.NAME,
            lastName: user.LAST_NAME
          };
        });
      }
      return resolve(users);
    });
  });
};
