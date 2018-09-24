import React from "react";
import Moment from "moment";
import { Button, Col, Input, Modal, Row, TimePicker } from "antd";
import { get } from "lodash";
import { DISABLED_HOURS } from "./defaults";

export const EventCreateModal = ({
  duration,
  eventEndTime,
  eventStartTime,
  handleCreateEvent,
  patient,
  productList,
  selectedProductId,
  selectedSpecialistId,
  smsKeys,
  specialistList,
  updateState,
  visible
}) => {
  const timeFormat = "HH:mm";
  const { smsApiKey, smsAuthKey } = smsKeys;
  return (
    <Modal
      onCancel={() => updateState(visible, false)}
      onOk={() => handleCreateEvent()}
      title={`Добавить событие на ${Moment(eventStartTime).format(
        "DD.MM.YYYY"
      )}`}
      visible={visible}
    >
      <div style={{ marginBottom: "5px" }}>
        <b>Время:</b>
        <Row>
          <Col span={8}>
            <TimePicker
              defaultValue={Moment(eventStartTime)}
              disabledHours={() => DISABLED_HOURS}
              format={timeFormat}
              hideDisabledOptions={true}
              minuteStep={5}
              onChange={time => updateState(eventStartTime, time)}
              size="small"
              value={Moment(eventStartTime)}
            />
          </Col>
          <Col span={8}>
            <Input disabled={true} size="small" value={duration} />
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            <TimePicker
              defaultValue={Moment(eventStartTime).add(30, "minutes")}
              disabledHours={() => DISABLED_HOURS}
              //disabled={duration ? true : false}
              format={timeFormat}
              hideDisabledOptions={true}
              minuteStep={5}
              onChange={time => updateState(eventEndTime, time)}
              size="small"
              value={
                //duration ? Moment(eventStartTime).add(duration, "minutes"):
                Moment(eventEndTime)
              }
            />
          </Col>
        </Row>
      </div>
      <div style={{ marginBottom: "5px" }}>
        <b>Услуга:</b>
        <Input
          disabled={true}
          size="small"
          value={productList[selectedProductId]}
        />
      </div>
      <div style={{ marginBottom: "5px" }}>
        <b>Специалист:</b>
        <Input
          disabled={true}
          size="small"
          value={specialistList[selectedSpecialistId]}
        />
      </div>
      <div style={{ marginBottom: "5px" }}>
        <b>Клиент:</b>
        <Input
          style={{ marginBottom: "5px" }}
          disabled={true}
          size="small"
          value={patient.PATIENT_NAME}
        />
        {get(patient, "PATIENT_PHONE.VALUE", " ") !== " " ? (
          <Button
            style={{ float: "right" }}
            size="small"
            type="primary"
            onClick={() =>
              this.sendSms({
                eventStartTime: eventStartTime,
                patient: patient,
                smsApiKey: smsApiKey,
                smsAuthKey: smsAuthKey
              })
            }
          >
            Отправить СМС!
          </Button>
        ) : null}
      </div>
    </Modal>
  );
};
