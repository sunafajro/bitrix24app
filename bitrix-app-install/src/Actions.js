/* global BX24 window */

/* инициализирует приложение */
export const appInit = () => {
  return new Promise((resolve, reject) => {
    BX24.init(() => resolve());
  });
};

/* получает список зарегистрированных мест встраивания */
export const placementGet = () => {
  return new Promise((resolve, reject) => {
    BX24.callMethod("placement.get", {}, result => {
      if (result.error()) {
        return reject();
      } else {
        const rawPlacements = result.data();
        const placements = rawPlacements.map(p => p.placement);
        return resolve(placements);
      }
    });
  });
};

/* метод получает список сотрудников */
export const getUsers = () => {
  return new Promise((resolve, reject) => {
    BX24.callMethod("user.get", {}, result => {
      if (result.error()) {
        return reject();
      } else {
        const rawUsers = result.data();
        let users = [];
        if (rawUsers && rawUsers.length) {
          rawUsers.forEach(user => {
            if (user.LAST_NAME) {
              users.push({
                id: user.ID,
                name: user.LAST_NAME + " " + user.NAME
              });
            }
          });
        }
        return resolve(users);
      }
    });
  });
};

/**
 * метод добавляет или убирает ссылку на приложение в интерфейс битрикса
 * @param { string } path
 * @param { Object } data
 * @return { string }
 */
export const handlePlacement = (path, data) => {
  return new Promise((resolve, reject) => {
    BX24.callMethod(path, data, result => {
      if (result.error()) {
        return reject();
      } else {
        return resolve();
      }
    });
  });
};

/**
 * выполняет пакетную обработку массива запросов
 * @param { Array } batch
 */
export const callBatch = batch => {
  return new Promise((resolve, reject) => {
    BX24.callBatch(batch, () => resolve());
  });
};

/* получает элемент хранилища для проверки успешного создания */
export const getEntityItem = () => {
  return new Promise((resolve, reject) => {
    BX24.callMethod(
      "entity.item.get",
      {
        ENTITY: "settings"
      },
      result => {
        if (result.error()) {
          return reject();
        } else {
          return resolve();
        }
      }
    );
  });
};
