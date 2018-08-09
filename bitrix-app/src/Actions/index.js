/* global BX24 */
import { isArrayNotEmpty } from "../Utils";

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
      if (
        isArrayNotEmpty(rawSettings) &&
        rawSettings[0].hasOwnProperty("PROPERTY_VALUES")
      ) {
        const propVal = rawSettings[0].PROPERTY_VALUES;
        return resolve({
          administrator: {
            id: propVal.userAdministratorId ? propVal.userAdministratorId : 0,
            name: propVal.userAdministratorName
              ? propVal.userAdministratorName
              : ""
          },
          smsKeys: {
            smsApiKey: propVal.smsApiKey ? propVal.smsApiKey : "",
            smsAuthKey: propVal.smsAuthKey ? propVal.smsAuthKey : ""
          }
        });
      }
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
      if (rawUsers && rawUsers.length) {
        users = rawUsers.map(user => {
          return {
            id: user.ID,
            firstName: user.NAME,
            lastName: user.LAST_NAME
          };
        });
      }
      return resolve(isArrayNotEmpty(users) ? users : []);
    });
  });
};
