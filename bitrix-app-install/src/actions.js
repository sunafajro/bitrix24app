/* global BX24 window */
import notification from "antd/lib/notification";

export const notify = text => {
  return notification.open({
    duration: 2,
    description: text
  });
};

/* метод получает список сотрудников */
export const getUsers = () => {
  return new Promise((resolve, reject) => {
    BX24.callMethod("user.get", {}, result => {
      if (result.error()) {
        return reject("Ошибка получения пользователей!");
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
        if (users.length) {
          return resolve(users);
        } else {
          return reject("Не найдено ни одного пользователя!");
        }
      }
    });
  });
};

/**
 * метод добавляет ссылку на приложение в интерфейс битрикса
 * @param { string } placement
 * @param { string } origin
 * @return { string }
 */
export const handleBindPlacement = (placement, origin) => {
  return new Promise((resolve, reject) => {
    BX24.callMethod(
      "placement.bind",
      {
        PLACEMENT: placement,
        HANDLER: `${origin}/index.php`,
        TITLE: "Регистратура",
        DESCRIPTION: "Тестовое приложение Регистратура"
      },
      result => {
        if (result.error()) {
          return reject("При добавлении элемента произошла ошибка!");
        } else {
          return resolve("Элемент успешно добавлен!");
        }
      }
    );
  });
};

/* метод убирает ссылку на приложение из интерфейса битрикса */
export const handleUnbindPlacement = (placement, origin) => {
  return new Promise((resolve, reject) => {
    BX24.callMethod(
      "placement.unbind",
      {
        PLACEMENT: placement,
        HANDLER: `${origin}/index.php`
      },
      result => {
        if (result.error()) {
          return reject("При удалении элемента произошла ошибка!");
        } else {
          return resolve("Элемент успешно удален!");
        }
      }
    );
  });
};