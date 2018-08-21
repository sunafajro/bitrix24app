/* global BX24 */
import React, { Component } from "react";
import { func, object } from "prop-types";
import Moment from "moment";
import axios from "axios";
import {
  Alert,
  Button,
  Col,
  Input,
  Modal,
  notification,
  Row,
  Table,
  TimePicker
} from "antd";
import {
  getPlacementData,
  getProductFields,
  getProductSectionList,
  getSectionProductList,
  getSpecialistsByProduct
} from "./Actions";
import { Aux, convertArrayToObject, notify } from "../Utils";
import { DISABLED_HOURS } from "./defaults";
import {
  prepareSpecialistByProduct,
  prepareTimeRange,
  prepareTableColumns,
  prepareTableDataWithEvents
} from "./PrepareFunctions";
import { checkPlacement } from "./PrepareFunctions";
import { SelectSection } from "./SelectSection";
import { SelectProduct } from "./SelectProduct";
import { SelectSpecialist } from "./SelectSpecialist";

export default class Registry extends Component {
  static propTypes = {
    params: object.isRequired,
    switchMode: func.isRequired
  };
  state = {
    administrator: {
      id: 0,
      name: ""
    },
    contactId: 0,
    currentDate: Moment().format("YYYY-MM-DD"),
    duration: "",
    events: [],
    eventStartTime: Moment(),
    eventEndTime: Moment(),
    fetchServices: false,
    leadId: 0,
    loading: false,
    patient: {
      PATIENT_NAME: "",
      PATIENT_TYPE: "",
      PATIENT_ID: 0,
      PATIENT_PHONE: { VALUE: " " }
    },
    products: [],
    selectedProductId: "-select-",
    selectedSectionId: "-select-",
    selectedSpecialistId: "-select-",
    sections: [],
    showTable: false,
    smsKeys: {
      smsApiKey: "",
      smsAuthKey: ""
    },
    specialists: [],
    startDate: Moment()
      .startOf("week")
      .format("YYYY-MM-DD"),
    endDate: Moment()
      .endOf("week")
      .format("YYYY-MM-DD"),
    tableColumns: [],
    tableData: [],
    timerange: [],
    users: [],
    visible: false
  };

  componentDidMount() {
    const { startDate, currentDate } = this.state;
    const { administrator, smsKeys, users } = this.props.params;
    const placementInfo = BX24.placement.info();
    const { contactId, leadId, type } = checkPlacement(placementInfo);
    const state = {
      administrator: { ...administrator },
      smsKeys: { ...smsKeys },
      tableColumns: prepareTableColumns(startDate, currentDate),
      timerange: prepareTimeRange(),
      users: [...users]
    };
    if (type) {
      getPlacementData(contactId, leadId, type)
        .then(patient => {
          state.patient = { ...patient };
          this.getSectionsOrProducts(state);
        })
        .catch(() => {
          notify("Ошибка получения идентификатора пациента!");
          this.getSectionsOrProducts(state);
        });
    } else {
      this.getSectionsOrProducts(state);
    }
  }

  getSectionsOrProducts = state => {
    return getProductSectionList()
      .then(sections => {
        if (Array.isArray(sections) && sections.length) {
          state.sections = [...sections];
          this.setState(state);
        } else {
          notify("Список разделов услуг пуст!");
          getSectionProductList()
            .then(products => {
              if (Array.isArray(products) && products.lengtр) {
                state.products = [...products];
              } else {
                notify("Список услуг пуст!");
              }
              this.setState(state);
            })
            .catch(() => {
              notify("Ошибка получения списка услуг!");
              this.setState(state);
            });
        }
      })
      .catch(() => {
        notify("Ошибка получения списка разделов услуг!");
        this.setState(state);
      });
  };

  sendSms = () => {
    const { smsApiKey, smsAuthKey } = this.state.smsKeys;
    const message = this.state.eventStartTime
      ? encodeURI(
          "Вы записаны на прием " +
            Moment(this.state.eventStartTime).format("DD.MM.YYYY HH:mm") +
            ". Отменить/Перенести по телефону +7(8352)32-40-29."
        )
      : null;
    const number =
      this.state.patient &&
      this.state.patient.hasOwnProperty("PATIENT_PHONE") &&
      this.state.patient.PATIENT_PHONE.hasOwnProperty("VALUE") &&
      this.state.patient.PATIENT_PHONE.VALUE &&
      this.state.patient.PATIENT_PHONE.VALUE !== " "
        ? this.state.patient.PATIENT_PHONE.VALUE.match(/\d/g).join("")
        : null;
    if (number && message && smsApiKey && smsAuthKey) {
      axios
        .post(`/send-sms.php`, {
          auth_key: smsAuthKey,
          number: number,
          message: message,
          api_key: smsApiKey
        })
        .then(result => {
          if (result.status === 200) {
            notification.open({
              duration: 2,
              description: result.data.status_text
                ? result.data.status_text
                : result.data.status_code === 100
                  ? "СМС уведомление успешно отправлено!"
                  : "Произошла ошибка"
            });
            return true;
          }
        })
        .catch(err => {
          notification.open({
            duration: 2,
            description: "Ошибка! " + err.message
          });
        });
    } else {
      notification.open({
        duration: 2,
        description: "Телефон или дата встречи не заданы!"
      });
    }
  };

  /**
   * @param {string} val
   * вызвается при выборе раздела товаров
   */
  handleSectionSelect = val => {
    return getSectionProductList(val)
      .then(products => {
        this.setState({
          events: [],
          products,
          selectedSectionId: val,
          selectedProductId: "-select-",
          selectedSpecialistId: "-select-",
          specialists: []
        });
      })
      .catch(err => {
        notify("Ошибка получения списка услуг!");
        this.setState({
          events: [],
          products: [],
          selectedSectionId: val,
          selectedProductId: "-select-",
          selectedSpecialistId: "-select-",
          specialists: []
        });
      });
  };

  /**
   * @param {string} val
   * вызвается при выборе раздела товаров
   */
  handleProductSelect = val => {
    const state = {
      events: [],
      selectedProductId: val,
      selectedSpecialistId: "-select-",
      specialists: []
    };
    return getProductFields()
      .then(({ durationProp, specialistProp }) => {
        if (specialistProp && durationProp) {
          return getSpecialistsByProduct(durationProp, specialistProp, val)
            .then(({ duration, specialists }) => {
              if (
                Array.isArray(specialists) &&
                specialists.length &&
                duration
              ) {
                state.duration = duration;
                state.specialists = prepareSpecialistByProduct(
                  this.state.users,
                  specialists
                );
                this.setState(state);
              } else if (
                Array.isArray(specialists) &&
                !specialists.length &&
                duration
              ) {
                notify("У услуги отсутсвует «Специалист»!");
                state.duration = duration;
                this.setState(state);
              } else if (
                Array.isArray(specialists) &&
                specialists.length &&
                !duration
              ) {
                notify("У услуги отсутсвует «Продолжительность»!");
                state.specialists = prepareSpecialistByProduct(
                  this.state.users,
                  specialists
                );
                this.setState(state);
              } else {
                notify(
                  "У услуги отсутсвуют «Специалист» и «Продолжительность»!"
                );
                this.setState(state);
              }
            })
            .catch(err => {
              notify("Ошибка получения свойств выбранной услуги!");
              this.setState(state);
            });
        } else {
          notify(
            "Поля «Специалист» или «Продолжительность» в списке полей услуги не найдено!"
          );
          this.setState(state);
        }
      })
      .catch(err => {
        notify("Ошибка получения списка свойств услуг!");
        this.setState(state);
      });
  };

  /**
   * @param {string} id
   * @param {string} startDate
   * @param {string} endDate
   * вызвается при выборе специалиста
   */
  handleSpecialistSelect = (id, startDate, endDate) => {
    this.setState({
      loading: true
    });
    /* получаем список событий календаря. */
    BX24.callMethod(
      "calendar.event.get",
      {
        type: "user",
        ownerId: id,
        from: startDate,
        to: endDate
      },
      result => {
        if (result.error()) {
          notification.open({
            duration: 2,
            description: "Ошибка получения календаря событий специалиста!"
          });
        } else {
          let events = result.data();
          let deals = [];
          /* Получаем список "дел" пользователя */
          BX24.callMethod(
            "crm.activity.list",
            {
              filter: {
                //OWNER_TYPE_ID
                RESPONSIBLE_ID: id,
                ">=START_TIME": Moment(startDate).format(),
                "<=END_TIME": Moment(endDate).format()
              }
            },
            result => {
              deals = deals.concat(result.data());
              if (result.more()) {
                result.next();
              } else {
                let items = [];
                if (events.length && deals.length) {
                  deals.forEach(deal => {
                    events = events.filter(event => {
                      return (
                        !Moment(Moment.utc(deal.START_TIME)).isSame(
                          Moment(event.DATE_FROM, "DD.MM.YYYY HH:mm:ss")
                        ) &&
                        !Moment(Moment.utc(deal.END_TIME)).isSame(
                          Moment(event.DATE_TO, "DD.MM.YYYY HH:mm:ss")
                        )
                      );
                    });
                  });
                  items = [...events, ...deals];
                } else if (events.length && !deals.length) {
                  items = [...events];
                } else if (!events.length && deals.length) {
                  items = [...deals];
                }
                prepareTableDataWithEvents(
                  this.deleteEvent,
                  this.handleShowModal,
                  items,
                  this.state.startDate,
                  (err, result) => {
                    if (err) {
                      notification.open({
                        duration: 2,
                        description:
                          "Ошибка получения событий календаря пользователя!"
                      });
                    } else {
                      this.setState({
                        loading: false,
                        events: items,
                        selectedSpecialistId: id,
                        tableData: result
                      });
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  };

  handleShowModal = date => {
    this.setState({ eventStartTime: date, eventEndTime: date, visible: true });
  };

  handleCreateEvent = () => {
    if (this.validate()) {
      const product = this.state.products.filter(item => {
        return item.ID === this.state.selectedProductId;
      });
      const communications = { ...this.state.patient.PATIENT_PHONE };
      communications.ENTITY_ID = this.state.leadId
        ? this.state.leadId
        : this.state.contactId
          ? this.state.contactId
          : "0";
      communications.ENTITY_TYPE_ID = this.state.leadId
        ? "1"
        : this.state.contactId
          ? "3"
          : "0";
      let newDeal = {
        COMMUNICATIONS: [communications],
        OWNER_ID: this.state.leadId
          ? this.state.leadId
          : this.state.contactId
            ? this.state.contactId
            : "0",
        OWNER_TYPE_ID: this.state.leadId
          ? "1"
          : this.state.contactId
            ? "3"
            : "0",
        TYPE_ID: "1",
        SUBJECT: product[0].NAME,
        START_TIME: Moment(this.state.eventStartTime).format(),
        END_TIME: this.state.duration
          ? Moment(this.state.eventStartTime)
              .add(this.state.duration, "minutes")
              .format()
          : Moment(this.state.eventEndTime).format(),
        COMPLETED: "N",
        PRIORITY: "2",
        RESPONSIBLE_ID: this.state.selectedSpecialistId,
        DESCRIPTION: "",
        DESCRIPTION_TYPE: "1",
        DIRECTION: "0"
      };
      /* добавляем событие для специалиста */
      BX24.callMethod("crm.activity.add", { fields: newDeal }, result => {
        if (result.error()) {
          notification.open({
            duration: 2,
            description: "Ошибка при добавлении события!"
          });
        } else {
          notification.open({
            duration: 2,
            description: "Событие успешно добавлено!"
          });
          const eventId = result.data();
          this.setState({ visible: false });
          this.handleSpecialistSelect(
            this.state.selectedSpecialistId,
            this.state.startDate,
            this.state.endDate
          );
          const checkDate = Moment(
            Moment(newDeal.START_TIME)
              .startOf("day")
              .subtract("1", "days")
              .format("YYYY-MM-DD") + " 15:00:00",
            "YYYY-MM-DD HH:mm:ss"
          );
          /* добавляем звонок для администратора */
          if (
            this.state.patient.PATIENT_PHONE &&
            Moment().isBefore(checkDate) &&
            this.state.administrator.id
          ) {
            const newCommunications = { ...this.state.patient.PATIENT_PHONE };
            const newStartDate = Moment(
              Moment(newDeal.START_TIME)
                .startOf("day")
                .subtract("1", "days")
                .format("YYYY-MM-DD") +
                " " +
                this.state.timerange[Math.floor(Math.random() * 48)],
              "YYYY-MM-DD HH:mm:ss"
            );
            const newEndDate = Moment(newStartDate).add("5", "minutes");
            newDeal.DESCRIPTION =
              "Начало приема: " +
              newDeal.START_TIME +
              "\nУслуга: " +
              newDeal.SUBJECT +
              "\n";
            newDeal.COMMUNICATIONS = [newCommunications];
            newDeal.START_TIME = Moment(newStartDate).format();
            newDeal.END_TIME = Moment(newEndDate).format();
            newDeal.SUBJECT =
              "Контрольный звонок для события [" + eventId + "]";
            newDeal.TYPE_ID = "2";
            newDeal.RESPONSIBLE_ID = this.state.administrator.id;
            newDeal.DIRECTION = "2";
            BX24.callMethod("crm.activity.add", { fields: newDeal }, result => {
              if (result.error()) {
                notification.open({
                  duration: 2,
                  description:
                    "Ошибка при добавлении предварительного звонка для администратора!"
                });
              } else {
                notification.open({
                  duration: 2,
                  description:
                    "Предварительный звонок для администратора успешно добавлен!"
                });
              }
            });
          }
        }
      });
    }
  };

  validate = () => {
    let result = true;

    if (this.state.patient.PATIENT_ID === 0) {
      notification.open({
        duration: 2,
        description:
          "Невозможно добавить событие. Отсуствует информация о клиенте!"
      });
      return false;
    }

    // проверка на то что дата внемя уже заняты ранее - временно отключаем
    // const eventStartTime = Moment(this.state.eventStartTime);
    // const eventEndTime = this.state.duration
    //   ? Moment(this.state.eventStartTime).add(this.state.duration, "minutes")
    //   : Moment(this.state.eventEndTime);
    // for (let i = 0; i < this.state.events.length; i++) {
    //   const startTime = Moment(
    //     this.state.events[i].DATE_FROM,
    //     "DD.MM.YYYY HH:mm:ss"
    //   );
    //   const endTime = Moment(
    //     this.state.events[i].DATE_TO,
    //     "DD.MM.YYYY HH:mm:ss"
    //   );
    // if (
    //   Moment(eventStartTime).isSameOrAfter(startTime) &&
    //   Moment(eventEndTime).isSameOrBefore(endTime)
    // ) {
    //   result = false;
    //   notification.open({
    //     duration: 2,
    //     description: "Этот временной интервал уже занят!"
    //   });
    //   break;
    // }
    // }
    return result;
  };

  deleteEvent = id => {
    /* удаляем событие специалиста */
    BX24.callMethod("crm.activity.delete", { id }, result => {
      if (result.error()) {
        notification.open({
          duration: 2,
          description: "Ошибка при удалении события!"
        });
      } else {
        notification.open({
          duration: 2,
          description: "Событие успешно удалено!"
        });
        this.handleSpecialistSelect(
          this.state.selectedSpecialistId,
          this.state.startDate,
          this.state.endDate
        );
        /* ищем предварительный звонок связанный с событием */
        BX24.callMethod(
          "crm.activity.list",
          {
            filter: {
              "%SUBJECT": "[" + id + "]"
            }
          },
          result => {
            if (result.error()) {
              notification.open({
                duration: 2,
                description:
                  "Ошибка при удалении предварительного звонка для администратора!"
              });
            } else {
              const data = result.data();
              if (data.length) {
                /* удаляем звонок  */
                BX24.callMethod(
                  "crm.activity.delete",
                  { id: data[0].ID },
                  result => {
                    if (result.error()) {
                      notification.open({
                        duration: 2,
                        description:
                          "Ошибка при удалении предварительного звонка для администратора!"
                      });
                    } else {
                      notification.open({
                        duration: 2,
                        description:
                          "Предварительный звонок для администратора успешно удален!"
                      });
                    }
                  }
                );
              }
            }
          }
        );
      }
    });
  };

  render() {
    const {
      currentDate,
      duration,
      endDate,
      eventStartTime,
      eventEndTime,
      loading,
      patient,
      products,
      sections,
      selectedProductId,
      selectedSectionId,
      selectedSpecialistId,
      specialists,
      startDate,
      tableColumns,
      tableData,
      visible
    } = this.state;

    const timeFormat = "HH:mm";
    const pagination = {
      hideOnSinglePage: true,
      pageSize: 12
    };
    let productList = convertArrayToObject(products);
    let specialistList = convertArrayToObject(specialists);

    console.log("count of sections: ", sections.length);
    console.log("count of products: ", products.length);
    return (
      <div style={{ padding: "5px", marginBottom: "1em" }}>
        <Row>
          <SelectSection
            handleSectionSelect={this.handleSectionSelect}
            sections={sections}
            selectedSectionId={selectedSectionId}
          />
          <SelectProduct
            handleProductSelect={this.handleProductSelect}
            specialists={specialists}
            selectedProductId={selectedProductId}
          />
        </Row>
        <Row>
          <SelectSpecialist
            endDate={endDate}
            handleSpecialistSelect={this.handleSpecialistSelect}
            products={products}
            selectedSpecialistId={selectedSpecialistId}
            startDate={startDate}
          />
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 16 }}
            lg={{ span: 16 }}
            xl={{ span: 16 }}
            xxl={{ span: 16 }}
            style={{
              paddingRight: "5px",
              marginBottom: "0.5em",
              textAlign: "right"
            }}
          >
            {selectedSpecialistId && selectedSpecialistId !== "-select-" ? (
              <Aux>
                <Button
                  icon="left-circle-o"
                  size="small"
                  style={{ maringRight: "0.5em" }}
                  onClick={() => {
                    const newStartDate = Moment(startDate)
                      .subtract(1, "w")
                      .format("YYYY-MM-DD");
                    const newEndDate = Moment(endDate)
                      .subtract(1, "w")
                      .format("YYYY-MM-DD");
                    const newTableColumns = prepareTableColumns(
                      newStartDate,
                      currentDate
                    );
                    this.setState({
                      endDate: newEndDate,
                      startDate: newStartDate,
                      tableColumns: newTableColumns
                    });
                    this.handleSpecialistSelect(
                      selectedSpecialistId,
                      newStartDate,
                      newEndDate
                    );
                  }}
                />
                {" " +
                  Moment(startDate).format("MMM") +
                  " " +
                  Moment(startDate).format("YYYY") +
                  " "}
                <Button
                  icon="right-circle-o"
                  size="small"
                  style={{ maringLeft: "0.5em" }}
                  onClick={() => {
                    const newStartDate = Moment(startDate)
                      .add(1, "w")
                      .format("YYYY-MM-DD");
                    const newEndDate = Moment(endDate)
                      .add(1, "w")
                      .format("YYYY-MM-DD");
                    const newTableColumns = prepareTableColumns(
                      newStartDate,
                      currentDate
                    );
                    this.setState({
                      endDate: newEndDate,
                      startDate: newStartDate,
                      tableColumns: newTableColumns
                    });
                    this.handleSpecialistSelect(
                      selectedSpecialistId,
                      newStartDate,
                      newEndDate
                    );
                  }}
                />
              </Aux>
            ) : null}
          </Col>
        </Row>
        {selectedSpecialistId && selectedSpecialistId !== "-select-" ? (
          <Table
            bordered
            columns={tableColumns}
            dataSource={tableData}
            loading={loading}
            pagination={pagination}
            size="small"
          />
        ) : null}
        <Modal
          onCancel={() => this.setState({ visible: false })}
          onOk={() => this.handleCreateEvent()}
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
                  onChange={time => this.setState({ eventStartTime: time })}
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
                  onChange={time => this.setState({ eventEndTime: time })}
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
            {patient &&
            patient.hasOwnProperty("PATIENT_PHONE") &&
            patient.PATIENT_PHONE.hasOwnProperty("VALUE") &&
            patient.PATIENT_PHONE.VALUE &&
            patient.PATIENT_PHONE.VALUE !== " " ? (
              <Button
                style={{ float: "right" }}
                size="small"
                type="primary"
                onClick={this.sendSms}
              >
                Отправить СМС!
              </Button>
            ) : null}
          </div>
        </Modal>
        {patient.PATIENT_ID === 0 && (
          <Alert
            message="Приложение запущено не из лида или контакта, добавление событий в расписание ограничено!"
            style={{ marginTop: "5px" }}
            type="warning"
            showIcon
          />
        )}
      </div>
    );
  }
}
