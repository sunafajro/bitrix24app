import React from "react";
import Moment from "moment";
import { Alert } from "antd";

export const Aux = props => props.children;

const AddEventDiv = ({ handleShowModal }) => {
  return (
    <div
      style={{ width: "100%", height: "100%" }}
      onClick={() => handleShowModal()}
    >
      &nbsp;
    </div>
  );
};

/**
 * готовит пустые строки таблицы
 */
export const prepareTableData = handleShowModal => {
  let result = [];
  const start_hour = 8;
  for (let i = 0; i < 12; i++) {
    const hour_from = start_hour + i;
    const hour_to = hour_from + 1;
    let time =
      (hour_from < 10 ? "0" + hour_from : hour_from) +
      ":00" +
      " - " +
      ((hour_to < 10 ? "0" + hour_to : hour_to) + ":00");
    result.push({
      key: "table-row" + i,
      time,
      пн: <AddEventDiv handleShowModal={handleShowModal} />, // <Button icon="plus" shape="circle" size="small" />,
      вт: <AddEventDiv handleShowModal={handleShowModal} />, // <Button icon="plus" shape="circle" size="small" />,
      ср: <AddEventDiv handleShowModal={handleShowModal} />, // <Button icon="plus" shape="circle" size="small" />,
      чт: <AddEventDiv handleShowModal={handleShowModal} />, // <Button icon="plus" shape="circle" size="small" />,
      пт: <AddEventDiv handleShowModal={handleShowModal} />, // <Button icon="plus" shape="circle" size="small" />,
      сб: <AddEventDiv handleShowModal={handleShowModal} />, // <Button icon="plus" shape="circle" size="small" />,
      вс: <AddEventDiv handleShowModal={handleShowModal} /> // <Button icon="plus" shape="circle" size="small" />,
    });
  }
  return result;
};

export const prepareCellEntries = (cellStartDate, events, handleShowModal) => {
  const cellEndDate = Moment(cellStartDate).add(1, "hours");
  const dataEvents = events.filter(event => {
    const dateFrom = Moment(event.DATE_FROM, "DD.MM.YYYY HH:mm:ss");
    const dateTo = Moment(event.DATE_TO, "DD.MM.YYYY HH:mm:ss");
    return (
      Moment(cellStartDate).isSameOrAfter(dateFrom) &&
      Moment(cellEndDate).isSameOrBefore(dateTo)
    );
  });
  return (
    <Aux>
      {dataEvents.length
        ? dataEvents.map(item => (
            <Alert key={"user-event-" + item.ID} message={item.DATE_FROM.substring(11, 16) + ". " + item.NAME} type="info" />
          ))
        : <AddEventDiv handleShowModal={handleShowModal} /> // <Button icon="plus" shape="circle" size="small" />
      }
    </Aux>
  );
};
