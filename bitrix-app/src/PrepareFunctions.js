import React from "react";
import Moment from "moment";
import { Icon, Tag } from "antd";

export const Aux = props => props.children;

const AddEventDiv = ({ handleShowModal, num }) => {
  return (
    <div
      className="app-addevent-class-name"
      onClick={() => handleShowModal(num)}
    >
      <Icon type="plus-circle-o" />
    </div>
  );
};

export const prepareCellEntries = (cellDate, events, handleShowModal) => {
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
      <AddEventDiv handleShowModal={handleShowModal} />
      {dataEvents.length && (
        dataEvents.map(item => (
          <div className="app-event-class-name" style={{ backgroundColor: item.COLOR }} key={"user-event-" + item.ID}>
            {`${item.DATE_FROM.substring(11, 16)} - ${item.DATE_TO.substring(11, 16)}`}
            <br />
            {item.NAME}
          </div>
        ))
      )}
    </Aux>
  );
};

/**
 * @param {Array} data
 * получает массив id сотрудников и возвращает массив объектов с id и name сотрудника
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
      className: "app-table-class-name"
    });
  }
  return result;
};

/**
 * готовит пустые строки таблицы
 */
export const prepareTableData = handleShowModal => {
  let result = [];
  result.push({
    key: "table-row",
    пн: <AddEventDiv handleShowModal={handleShowModal} num={0} />,
    вт: <AddEventDiv handleShowModal={handleShowModal} num={1} />,
    ср: <AddEventDiv handleShowModal={handleShowModal} num={2} />,
    чт: <AddEventDiv handleShowModal={handleShowModal} num={3} />,
    пт: <AddEventDiv handleShowModal={handleShowModal} num={4} />,
    сб: <AddEventDiv handleShowModal={handleShowModal} num={5} />,
    вс: <AddEventDiv handleShowModal={handleShowModal} num={6} />
  });
  return result;
};

/**
 * @param {Array} items
 * @param {Function} handleShowModal
 * заполняем строки таблицы событиями
 */
export const prepareTableDataWithEvents = (
  handleShowModal,
  items,
  startDate,
  tableData,
) => {
  let result = [];
  const events = sortAndFixItems(items);
  tableData.forEach(row => {
    let newRow = {
      key: row.key
    };
    Object.keys(row).forEach(cell => {
      switch (cell) {
        case "пн": {
          const cellStartDate = Moment(startDate)
            .startOf("week")
            .format("YYYY-MM-DD");
          newRow[cell] = prepareCellEntries(
            cellStartDate,
            events,
            handleShowModal
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
            handleShowModal
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
            handleShowModal
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
            handleShowModal
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
            handleShowModal
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
            handleShowModal
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
            handleShowModal
          );
          break;
        }
        default:
      }
    });
    result.push(newRow);
  });
  return result;
};

export const sortAndFixItems = (data) => {
  data.forEach(item => {
    if (item.hasOwnProperty("START_TIME") && item.hasOwnProperty("END_TIME")) {
      const dateFrom = Moment.utc(item.START_TIME);
      const dateTo = Moment.utc(item.END_TIME);
      item.DATE_FROM = Moment(dateFrom).format("DD.MM.YYYY HH:mm:ss");
      item.DATE_TO = Moment(dateTo).format("DD.MM.YYYY HH:mm:ss");
      item.NAME = item.SUBJECT;
      /* дела заливаем светло-зеленым */
      item.COLOR = "#dbfccd";
    } else {
      /* события без дел (отсуствие на работе) заливаем серым */
      item.COLOR = "#eeeeee";
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
}
