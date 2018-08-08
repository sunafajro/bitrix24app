import { notification } from "antd";

export const Aux = ({ children }) => children;

export const notify = text => {
  return notification.open({
    duration: 2,
    description: text
  });
};