import Moment from "moment";

export const ENTITY_ADD = "entity.add";
export const ENTITY_ITEM_ADD = "entity.item.add";
export const ENTITY_ITEM_PROPERTY_ADD = "entity.item.property.add";

export const NEW_STORAGE = {
  ENTITY: "settings",
  NAME: "Settings",
  ACCESS: {
    AU: "W"
  }
};

export const CONTACT_CONTEXT = {
  ENTITY: "settings",
  PROPERTY: "isContactContextLinkEnabled",
  NAME: "Link placed In Contact Context",
  TYPE: "S"
};

export const CONTACT_CARD = {
  ENTITY: "settings",
  PROPERTY: "isContactCardLinkEnabled",
  NAME: "Link placed In Contact Card",
  TYPE: "S"
};

export const LEAD_CONTEXT = {
  ENTITY: "settings",
  PROPERTY: "isLeadContextLinkEnabled",
  NAME: "Link placed In Lead Context",
  TYPE: "S"
};

export const LEAD_CARD = {
  ENTITY: "settings",
  PROPERTY: "isLeadCardLinkEnabled",
  NAME: "Link placed In Lead Card",
  TYPE: "S"
};

export const SMS_API_KEY = {
  ENTITY: "settings",
  PROPERTY: "smsApiKey",
  NAME: "Api key for sending SMS",
  TYPE: "S"
};

export const SMS_AUTH_KEY = {
  ENTITY: "settings",
  PROPERTY: "smsAuthKey",
  NAME: "Auth key for sending SMS",
  TYPE: "S"
};

export const USER_ADMINISTRATOR_ID = {
  ENTITY: "settings",
  PROPERTY: "userAdministratorId",
  NAME: "User administrator ID",
  TYPE: "S"
};

export const USER_ADMINISTRATOR_NAME = {
  ENTITY: "settings",
  PROPERTY: "userAdministratorName",
  NAME: "User administrator name",
  TYPE: "S"
};

export const getEntityData = VALUES => {
  return {
    ENTITY: "settings",
    DATE_ACTIVE_FROM: Moment().format(),
    NAME: "App options",
    PROPERTY_VALUES: VALUES
  };
};
