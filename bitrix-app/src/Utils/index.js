import { notification } from "antd";

/**
 * 
 * @param {Array} arr
 * @return {boolean}
 */
export const isArrayNotEmpty = arr => Array.isArray(arr) && arr.length;
export const Aux = ({ children }) => children;

export const notify = text => {
    return notification.open({
      duration: 2,
      description: text
    });
  };