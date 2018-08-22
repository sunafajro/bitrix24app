/* global BX24 */
import { get } from "lodash";
import Moment from "moment";

/**
 * на основании места вызова приложения, получат данные из лида или контакта
 * @param {number} contactId
 * @param {number} leadId
 * @param {string} type
 * @returns {Object}
 */
export const getPlacementData = (
  contactId = 0,
  leadId = 0,
  type = "crm.lead.get"
) => {
  return new Promise((resolve, reject) => {
    BX24.callMethod(
      type,
      { id: type === "crm.lead.get" ? leadId : contactId },
      result => {
        if (result.error()) return reject();
        const patientData = result.data();
        const patient = {
          PATIENT_NAME: `${patientData.LAST_NAME} ${patientData.NAME} ${
            patientData.SECOND_NAME
          }`,
          PATIENT_TYPE: type === "crm.lead.get" ? "lead" : "contact",
          PATIENT_ID: patientData.ID,
          PATIENT_PHONE:
            patientData.PHONE && patientData.PHONE.length
              ? patientData.PHONE[0]
              : { VALUE: " " }
        };
        return resolve(patient);
      }
    );
  });
};

/**
 * получает список разделов товаров
 * @return { Array }
 */
export const getProductSectionList = () => {
  return new Promise((resolve, reject) => {
    let sections = [];
    BX24.callMethod(
      "crm.productsection.list",
      {
        order: { NAME: "ASC" }
      },
      result => {
        if (result.error()) return reject();
        sections = sections.concat(result.data());
        if (result.more()) {
          result.next();
        } else {
          return resolve(
            Array.isArray(sections) && sections.length ? sections : []
          );
        }
      }
    );
  });
};

/**
 * получает список продуктов по разделу
 * @param { string } sectionId
 * @return { Array }
 */
export const getSectionProductList = (sectionId = "") => {
  return new Promise((resolve, reject) => {
    let criteria = {
      order: { NAME: "ASC" },
      select: ["ID", "NAME", "DESCRIPTION", "CURRENCY_ID", "PRICE"]
    };
    if (sectionId !== "") {
      criteria.filter = { SECTION_ID: sectionId };
    }
    let products = [];
    /* Возвращает список товаров по фильтру. */
    BX24.callMethod("crm.product.list", criteria, result => {
      if (result.error()) return reject();
      products = products.concat(result.data());
      if (result.more()) {
        result.next();
      } else {
        return resolve(
          Array.isArray(products) && products.length ? products : []
        );
      }
    });
  });
};

/* Возвращает описание полей товара. */
export const getProductFields = () => {
  return new Promise((resolve, reject) => {
    BX24.callMethod("crm.product.fields", {}, result => {
      if (result.error()) reject();
      const rawProductFields = result.data();
      let specialistProp = "";
      let durationProp = "";
      if (rawProductFields) {
        Object.keys(rawProductFields).forEach(field => {
          /* ищем то в которое связывает услугу с исполнителем */
          if (
            rawProductFields[field].propertyType === "S" &&
            rawProductFields[field].title === "Специалист" &&
            rawProductFields[field].type === "product_property" &&
            rawProductFields[field].userType === "employee"
          ) {
            specialistProp = field;
          }
          /* ищем то в котором указана продолжительность услуги (строка или число) */
          if (
            (rawProductFields[field].propertyType === "N" ||
              rawProductFields[field].propertyType === "S") &&
            rawProductFields[field].title === "Время, минут" &&
            rawProductFields[field].type === "product_property" &&
            rawProductFields[field].userType === ""
          ) {
            durationProp = field;
          }
        });
      }
      return resolve({ specialistProp, durationProp });
    });
  });
};

/**
 * возвращает массив специалистов привязанных к услуге/товару
 * @param {string} durationProp
 * @param {string} specialistProp
 * @param {string} val
 * @returns {Object}
 */
export const getSpecialistsByProduct = (durationProp, specialistProp, val) => {
  return new Promise((resolve, reject) => {
    /* Возвращает товар по идентификатору. */
    BX24.callMethod("crm.product.get", { ID: val }, result => {
      if (result.error()) reject();
      const rawProductData = result.data();
      let duration = "";
      let specialists = [];
      if (rawProductData) {
        /* продолжительность услуги */
        duration = get(rawProductData, `${durationProp}.value`, "");
        /* наполняем массив с id специалистов связанных с услугой */
        if (
          Array.isArray(rawProductData[specialistProp]) &&
          rawProductData[specialistProp].length
        ) {
          specialists = rawProductData[specialistProp].map(s => {
            return s.value;
          });
        }
      }
      return resolve({ duration, specialists });
    });
  });
};

/**
 * возвращает список событий календаря специалиста
 * @param {string} id
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Array}
 */
export const getSpecialistCalendarEvents = (id, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    BX24.callMethod(
      "calendar.event.get",
      {
        type: "user",
        ownerId: id,
        from: startDate,
        to: endDate
      },
      result => {
        if (result.error()) reject();
        const events = result.data();
        return resolve(Array.isArray(events) && events.length ? events : []);
      }
    );
  });
};

/**
 * возвращает список дел специалиста
 * @param {string} id
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Array}
 */
export const getSpecialistDeals = (id, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    let deals = [];
    BX24.callMethod(
      "crm.activity.list",
      {
        filter: {
          RESPONSIBLE_ID: id,
          ">=START_TIME": Moment(startDate).format(),
          "<=END_TIME": Moment(endDate).format()
        }
      },
      result => {
        if (result.error()) reject();
        deals = deals.concat(result.data());
        if (result.more()) {
          result.next();
        } else {
          return resolve(Array.isArray(deals) && deals.length ? deals : []);
        }
      }
    );
  });
};
