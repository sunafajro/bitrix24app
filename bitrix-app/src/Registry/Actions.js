/* global BX24 */
import { isArrayNotEmpty } from "../Utils";

export const getPlacementData = (contactId = 0, leadId = 0, type = 'crm.lead.get') => {
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
          return resolve(isArrayNotEmpty(sections) ? sections : []);
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
export const getSectionProductList = (sectionId = null) => {
  let criteria = {
    order: { NAME: "ASC" },
    select: ["ID", "NAME", "DESCRIPTION", "CURRENCY_ID", "PRICE"]
  };
  if (sectionId) {
    criteria.filter = { SECTION_ID: sectionId };
  }
  let products = [];
  /* Возвращает список товаров по фильтру. */
  return new Promise((resolve, reject) => {
    BX24.callMethod("crm.product.list", criteria, result => {
      if (result.error()) return reject();
      products = products.concat(result.data());
      if (result.more()) {
        result.next();
      } else {
        this.setState({ products });
      }
    });
  });
};
