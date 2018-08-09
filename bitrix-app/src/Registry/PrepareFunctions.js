/* global BX24 */
import React from "react";
import Moment from "moment";
import { Button, Icon, Popconfirm, Row, Tag } from "antd";
import { Aux } from "../Utils";

export const prepareTimeRange = () => {
  let timerange = [];
  for (let h = 15; h < 19; h++) {
    for (let m = 0; m < 60; m = m + 5) {
      timerange.push(h + ":" + (m < 10 ? "0" + m : m) + ":00");
    }
  }
  return timerange;
};
/**
 *
 * @param {Object} info
 */
export const checkPlacement = info => {
  let contactId = 0;
  let leadId = 0;
  let type = "";
  if (info.hasOwnProperty("placement")) {
    if (
      info.placement === "CRM_LEAD_LIST_MENU" ||
      info.placement === "CRM_LEAD_DETAIL_TAB"
    ) {
      leadId = info.options.ID;
      type = "crm.lead.get";
    } else if (
      info.placement === "CRM_CONTACT_LIST_MENU" ||
      info.placement === "CRM_CONTACT_DETAIL_TAB"
    ) {
      contactId = info.options.ID;
      type = "crm.contact.get";
    }
  }
  return { contactId, leadId, type };
};

const AddEventDiv = ({ date, handleShowModal }) => {
  return (
    <div
      className="app-addevent-class-name"
      onClick={() => handleShowModal(date)}
    >
      <Icon type="plus-circle-o" />
    </div>
  );
};

export const prepareCellEntries = (
  cellDate,
  events,
  handleShowModal,
  deleteEvent
) => {
  const dataEvents = events.filter(event => {
    const dateFrom = Moment(event.DATE_FROM, "DD.MM.YYYY HH:mm:ss").format(
      "YYYY-MM-DD"
    );
    const dateTo = Moment(event.DATE_TO, "DD.MM.YYYY HH:mm:ss").format(
      "YYYY-MM-DD"
    );
    return Moment(cellDate).isSame(dateFrom) && Moment(cellDate).isSame(dateTo);
  });
  return (
    <Aux>
      <AddEventDiv date={Moment(cellDate)} handleShowModal={handleShowModal} />
      {dataEvents.length
        ? dataEvents.map(item => (
            <div
              className="app-event-class-name"
              style={{
                backgroundColor: item.COLOR,
                fontSize: "12px"
              }}
              key={"user-event-" + item.ID}
            >
              <Row>
                {`${item.DATE_FROM.substring(
                  11,
                  16
                )} - ${item.DATE_TO.substring(11, 16)}`}
                <br />
                {item.NAME}
                <br />
                {item.PATIENT_NAME}
                {item.isDeal ? (
                  <div style={{ position: "absolute", top: 0, right: 0 }}>
                    <Popconfirm
                      title="Вы уверены？"
                      okText="Да"
                      onConfirm={() => deleteEvent(item.ID)}
                      cancelText="Нет"
                    >
                      <Button
                        type="danger"
                        size="small"
                        shape="circle"
                        icon="delete"
                      />
                    </Popconfirm>
                  </div>
                ) : null}
              </Row>
            </div>
          ))
        : null}
    </Aux>
  );
};

/**
 * получает массив id сотрудников и возвращает массив объектов с id и name сотрудника
 * @param {Array} users
 * @param {Array} data
 */
export const prepareSpecialistByProduct = (users, data) => {
  let result = [];
  users.forEach(user => {
    if (data.indexOf(user.id) !== -1) {
      result.push({
        ID: user.id,
        NAME: user.lastName + " " + user.firstName
      });
    }
  });
  return result;
};

/**
 * @param {string} current
 * @param {string} start
 * готовит заголовок таблицы
 */
export const prepareTableColumns = (start, current) => {
  let result = [];
  for (let i = 0; i < 7; i++) {
    const dt = Moment(start).add(i, "days");
    const dayName = Moment(dt).format("ddd");
    const title =
      Moment(dt).format("YYYY-MM-DD") === current ? (
        <div>
          {dayName + ", "} <Tag color="#108ee9">{Moment(dt).format("D")}</Tag>
        </div>
      ) : (
        dayName + ", " + Moment(dt).format("D")
      );
    result.push({
      title: title,
      dataIndex: dayName,
      key: dayName,
      className: "app-table-class-name",
      width: "14%"
    });
  }
  return result;
};

/**
 * готовит пустые строки таблицы
 */
export const emptyTableData = () => {
  return {
    key: "table-row",
    пн: "",
    вт: "",
    ср: "",
    чт: "",
    пт: "",
    сб: "",
    вс: ""
  };
};

/**
 * @param {Array} items
 * @param {Function} handleShowModal
 * заполняем строки таблицы событиями
 */
export const prepareTableDataWithEvents = (
  deleteEvent,
  handleShowModal,
  items,
  startDate,
  callback
) => {
  /* формируем пул промисов для запроса данных пациента */
  const EventsPromises = items.map(item => {
    let type;
    if (
      item.hasOwnProperty("OWNER_TYPE_ID") &&
      (item.OWNER_TYPE_ID === 1 || item.OWNER_TYPE_ID === 3)
    ) {
      switch (item.OWNER_TYPE_ID) {
        /* встреча создана от лида */
        case "1":
          type = "crm.lead.get";
          break;
        /* встреча создана от контакта */
        case "3":
          type = "crm.contact.get";
          break;
        default:
      }
      return new Promise((resolve, reject) => {
        BX24.callMethod(type, { id: item.OWNER_ID }, result => {
          if (result.error()) {
            return reject(result.error());
          } else {
            const patient = result.data();
            item.PATIENT_NAME = `${patient.LAST_NAME} ${patient.NAME} ${
              patient.SECOND_NAME
            }`;
            item.PATIENT_TYPE = type === "crm.lead.get" ? "lead" : "contact";
            item.PATIENT_ID = patient.ID;
            return resolve(item);
          }
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        return resolve(item);
      });
    }
  });

  Promise.all(EventsPromises).then(
    data => {
      let result = [];
      const events = sortAndFixItems(data);
      const columns = emptyTableData();
      let newRow = { key: "table-row" };
      Object.keys(columns).forEach(cell => {
        switch (cell) {
          case "пн": {
            const cellStartDate = Moment(startDate)
              .startOf("week")
              .format("YYYY-MM-DD");
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              handleShowModal,
              deleteEvent
            );
            break;
          }
          case "вт": {
            const cellStartDate = Moment(startDate)
              .startOf("week")
              .add(1, "days")
              .format("YYYY-MM-DD");
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              handleShowModal,
              deleteEvent
            );
            break;
          }
          case "ср": {
            const cellStartDate = Moment(startDate)
              .startOf("week")
              .add(2, "days")
              .format("YYYY-MM-DD");
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              handleShowModal,
              deleteEvent
            );
            break;
          }
          case "чт": {
            const cellStartDate = Moment(startDate)
              .startOf("week")
              .add(3, "days")
              .format("YYYY-MM-DD");
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              handleShowModal,
              deleteEvent
            );
            break;
          }
          case "пт": {
            const cellStartDate = Moment(startDate)
              .startOf("week")
              .add(4, "days")
              .format("YYYY-MM-DD");
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              handleShowModal,
              deleteEvent
            );
            break;
          }
          case "сб": {
            const cellStartDate = Moment(startDate)
              .startOf("week")
              .add(5, "days")
              .format("YYYY-MM-DD");
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              handleShowModal,
              deleteEvent
            );
            break;
          }
          case "вс": {
            const cellStartDate = Moment(startDate)
              .startOf("week")
              .add(6, "days")
              .format("YYYY-MM-DD");
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              handleShowModal,
              deleteEvent
            );
            break;
          }
          default:
        }
      });
      result.push(newRow);
      callback(null, result);
    },
    reason => {
      callback(reason);
    }
  );
};

export const sortAndFixItems = data => {
  data.forEach(item => {
    if (item.hasOwnProperty("START_TIME") && item.hasOwnProperty("END_TIME")) {
      const dateFrom = item.START_TIME; // Moment.utc(item.START_TIME);
      const dateTo = item.END_TIME; // Moment.utc(item.END_TIME);
      item.DATE_FROM = Moment(dateFrom).format("DD.MM.YYYY HH:mm:ss");
      item.DATE_TO = Moment(dateTo).format("DD.MM.YYYY HH:mm:ss");
      item.NAME = item.SUBJECT;
      /* дела заливаем светло-зеленым */
      item.COLOR = "#dbfccd";
      item.isDeal = true;
    } else {
      /* события без дел (отсуствие на работе) заливаем серым */
      item.COLOR = "#eeeeee";
      item.isDeal = false;
    }
  });
  data.sort((a, b) => {
    if (a.DATE_FROM > b.DATE_FROM) {
      return 1;
    }
    if (a.DATE_FROM < b.DATE_FROM) {
      return -1;
    }
    return 0;
  });
  return data;
};
