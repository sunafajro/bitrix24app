import { notification } from "antd";

export const Aux = ({ children }) => children;
/**
 * Выводит уведомление
 * @param {string} text
 * @returns {void}
 */
export const notify = text => {
  return notification.open({
    duration: 2,
    description: text
  });
};

/**
 * Преобразует массив элементов в объект
 * @param {Array} array
 * @returns {Object}
 */
export const convertArrayToObject = array => {
  const newObject = {};
  array.forEach(item => {
    newObject[item.ID] = item.NAME;
  });
  return newObject;
};
