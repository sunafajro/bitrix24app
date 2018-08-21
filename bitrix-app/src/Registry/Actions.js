/* global BX24 */

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
        /* ищем то в котором указана продолжительность услуги */
        if (
          rawProductFields[field].propertyType === "N" &&
          rawProductFields[field].title === "Время, минут" &&
          rawProductFields[field].type === "product_property" &&
          rawProductFields[field].userType === ""
        ) {
          durationProp = field;
        }
      });
      return resolve({ specialistProp, durationProp });
    });
  });
};

export const getSpecialistsByProduct = (durationProp, specialistProp, val) => {
  return new Promise((resolve, reject) => {
    /* Возвращает товар по идентификатору. */
    BX24.callMethod("crm.product.get", { ID: val }, result => {
      if (result.error()) reject();
      const rawProductData = result.data();
      const duration =
        rawProductData.hasOwnProperty("durationProp") &&
        rawProductData[durationProp].value
          ? rawProductData[durationProp].value
          : null;
      let specialists = [];
      if (rawProductData && rawProductData[specialistProp]) {
        /* наполняем массив с id специалистов связанных с услугой */
        rawProductData[specialistProp].forEach(specialist => {
          specialists.push(specialist.value);
        });
      }
      return { duration, specialists };
    });
  });
};
