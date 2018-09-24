/* global BX24 */
import React, { Component, Fragment } from "react";
import { func, object } from "prop-types";
import { get, cloneDeep } from "lodash";
import Moment from "moment";
import axios from "axios";
import { Alert, Button, Col, notification, Row, Spin, Table } from "antd";
import Actions from "./Actions";
import { convertArrayToObject, notify } from "../Utils";
import { defaultState } from "./defaults";
import {
  checkPlacement,
  prepareSpecialistByProduct,
  prepareTimeRange,
  prepareTableColumns,
  prepareTableDataWithEvents
} from "./PrepareFunctions";
import { SectionsProductsRow } from "./SectionsProductsRow";
import { SelectSpecialist } from "./SelectSpecialist";
import { EventCreateModal } from "./EventCreateModal";

export default class Registry extends Component {
  static propTypes = {
    params: object.isRequired,
    switchMode: func.isRequired
  };

  state = cloneDeep(defaultState);

  componentDidMount() {
    this.startRegistry();
  }

  startRegistry = async () => {
    const { startDate, currentDate } = this.state;
    const { administrator, smsKeys, users } = this.props.params;
    const placementInfo = BX24.placement.info();
    const { contactId, leadId, type } = checkPlacement(placementInfo);
    const state = {
      administrator: { ...administrator },
      initLoading: false,
      smsKeys: { ...smsKeys },
      tableColumns: prepareTableColumns(startDate, currentDate),
      timerange: prepareTimeRange(),
      users: [...users]
    };
    if (type) {
      try {
        const patient = await Actions.getPlacementData(contactId, leadId, type);
        state.patient = cloneDeep(patient);
      } catch (e) {
        notify("Ошибка при получении контактных данных пациента!");
        console.log("startRegistry::getPlacementData", e);
      }
    }
    try {
      const { products, sections } = await this.getSectionsOrProducts(state);
      state.sections = cloneDeep(sections);
      state.products = cloneDeep(products);
      this.setState(state);
    } catch (e) {
      notify("Ошибка получения списка разделов или услуг!");
      console.log("startRegistry::getSectionsOrProducts", e);
      this.setState(state);
    }
  };

  /**
   * Получает список разделов или услуг
   * @param {Object} state
   * @returns {Object}
   */
  getSectionsOrProducts = async state => {
    try {
      const sections = await Actions.getProductSectionList();
      if (Array.isArray(sections) && sections.length) {
        return { sections, products: [] };
      } else {
        notify("Список разделов услуг пуст!");
        try {
          const products = await Actions.getSectionProductList();
          if (Array.isArray(products) && products.lengtр) {
            return { products, sections: [] };
          } else {
            notify("Список услуг пуст!");
            return { products: [], sections: [] };
          }
        } catch (e) {
          notify("Ошибка получения списка услуг!");
          console.log("getSectionsOrProducts::getSectionProductList", e);
          return { products: [], sections: [] };
        }
      }
    } catch (e) {
      notify("Ошибка получения списка разделов!");
      console.log("getSectionsOrProducts::getProductSectionList", e);
      return { products: [], sections: [] };
    }
  };

  sendSms = ({ patient, smsApiKey, smsAuthKey, eventStartTime }) => {
    const message = eventStartTime
      ? encodeURI(
          "Вы записаны на прием " +
            Moment(eventStartTime).format("DD.MM.YYYY HH:mm") +
            ". Отменить/Перенести по телефону +7(8352)32-40-29."
        )
      : null;
    let number = get(patient, "PATIENT_PHONE.VALUE", " ");
    if (number !== " ") {
      number = number.match(/\d/g).join("");
    } else {
      number = null;
    }
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
  handleSectionSelect = async val => {
    const state = {
      events: [],
      products: [],
      selectedSectionId: val,
      selectedProductId: "-select-",
      selectedSpecialistId: "-select-",
      specialists: []
    };
    try {
      const products = await Actions.getSectionProductList(val);
      state.products = cloneDeep(products);
      this.setState(state);
    } catch (e) {
      notify("Ошибка получения списка услуг!");
      console.log("handleSectionSelect::getSectionProductList", e);
      this.setState(state);
    }
  };

  /**
   * запрашивает список специалистов и продолжительность выбранной услуги
   * @param {string} val
   * @returns {void}
   */
  handleProductSelect = val => {
    const state = {
      duration: "",
      events: [],
      selectedProductId: val,
      selectedSpecialistId: "-select-",
      specialists: []
    };
    return Actions.getProductFields()
      .then(({ durationProp, specialistProp }) => {
        if (specialistProp && durationProp) {
          return Actions.getSpecialistsByProduct(
            durationProp,
            specialistProp,
            val
          )
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
              console.log(
                "error::handleProductSelect::getProductFields::getSpecialistsByProduct",
                err
              );
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
        console.log("error::handleProductSelect::getProductFields", err);
        notify("Ошибка получения списка свойств услуг!");
        this.setState(state);
      });
  };

  /**
   * вызвается при выборе специалиста
   * @param {string} id
   * @param {string} startDate
   * @param {string} endDate
   * @returns {void}
   */
  handleSpecialistSelect = (id, startDate, endDate) => {
    // this.setState({
    //   loading: true
    // });
    const state = {
      // loading: false,
      events: [],
      selectedSpecialistId: id,
      tableData: []
    };
    return Actions.getSpecialistCalendarEvents(id, startDate, endDate)
      .then(events => {
        return Actions.getSpecialistDeals(id, startDate, endDate)
          .then(deals => {
            let items = [];
            if (
              Array.isArray(events) &&
              events.length &&
              Array.isArray(deals) &&
              deals.length
            ) {
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
                  console.log(
                    "error::handleSpecialistSelect::getSpecialistCalendarEvents::getSpecialistDeals",
                    err
                  );
                  notify("Ошибка получения событий календаря пользователя!");
                } else {
                  //state.loading = false;
                  state.events = [...items];
                  state.tableData = [...result];
                }
                this.setState(state);
              }
            );
          })
          .catch(err => {
            console.log(
              "error::handleSpecialistSelect::getSpecialistCalendarEvents::getSpecialistDeals",
              err
            );
            notify("Ошибка получения дел специалиста!");
            this.setState(state);
          });
      })
      .catch(err => {
        console.log(
          "error::handleSpecialistSelect::getSpecialistCalendarEvents",
          err
        );
        notify("Ошибка получения событий из календаря специалиста!");
        this.setState(state);
      });
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
    const { patient } = this.state;
    let result = true;
    if (patient.hasOwnProperty("PATIENT_ID") && patient.PATIENT_ID === 0) {
      notify("Невозможно добавить событие. Отсуствует информация о клиенте!");
      return false;
    }

    // проверка на то что дата время уже заняты ранее - временно отключаем
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

  deleteEvent = async id => {
    const { endDate, selectedSpecialistId, startDate } = this.state;
    try {
      /* удаляем событие специалиста */
      await Actions.deleteEventFromCalendar(id);
      notify("Событие успешно удалено!");
      this.handleSpecialistSelect(selectedSpecialistId, startDate, endDate);
      try {
        /* ищем предварительный звонок связанный с событием */
        const data = await Actions.findPlannedCall(id);
        if (data.length) {
          try {
            /* удаляем звонок  */
            await Actions.deletePlannedCall(data[0].ID);
            notify("Предварительный звонок для администратора успешно удален!");
          } catch (e) {
            notify(
              "Ошибка при удалении предварительного звонка для администратора!"
            );
          }
        }
      } catch (e) {
        notify(
          "Ошибка при удалении предварительного звонка для администратора!"
        );
      }
    } catch (e) {
      notify("Ошибка при удалении события!");
      console.log("error::deleteEvent::deleteEventFromCalendar", e);
    }
  };

  updateState = (key, value) => this.setState({ [key]: value });

  render() {
    const state = this.state;

    if (state.initLoading) {
      return <Spin />;
    }

    const pagination = {
      hideOnSinglePage: true,
      pageSize: 12
    };

    let productList = convertArrayToObject(state.products);
    let specialistList = convertArrayToObject(state.specialists);

    return (
      <div style={{ padding: "5px", marginBottom: "1em" }}>
        <SectionsProductsRow
          handleProductSelect={this.handleProductSelect}
          handleSectionSelect={this.handleSectionSelect}
          products={state.products}
          sections={state.sections}
          selectedProductId={state.selectedProductId}
          selectedSectionId={state.selectedSectionId}
        />
        <Row>
          <SelectSpecialist
            endDate={state.endDate}
            handleSpecialistSelect={this.handleSpecialistSelect}
            selectedSpecialistId={state.selectedSpecialistId}
            specialists={state.specialists}
            startDate={state.startDate}
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
            {state.selectedSpecialistId &&
            state.selectedSpecialistId !== "-select-" ? (
              <Fragment>
                <Button
                  icon="left-circle-o"
                  size="small"
                  style={{ maringRight: "0.5em" }}
                  onClick={() => {
                    const newStartDate = Moment(state.startDate)
                      .subtract(1, "w")
                      .format("YYYY-MM-DD");
                    const newEndDate = Moment(state.endDate)
                      .subtract(1, "w")
                      .format("YYYY-MM-DD");
                    const newTableColumns = prepareTableColumns(
                      newStartDate,
                      state.currentDate
                    );
                    this.setState({
                      endDate: newEndDate,
                      startDate: newStartDate,
                      tableColumns: newTableColumns
                    });
                    this.handleSpecialistSelect(
                      state.selectedSpecialistId,
                      newStartDate,
                      newEndDate
                    );
                  }}
                />
                {" " +
                  Moment(state.startDate).format("MMM") +
                  " " +
                  Moment(state.startDate).format("YYYY") +
                  " "}
                <Button
                  icon="right-circle-o"
                  size="small"
                  style={{ maringLeft: "0.5em" }}
                  onClick={() => {
                    const newStartDate = Moment(state.startDate)
                      .add(1, "w")
                      .format("YYYY-MM-DD");
                    const newEndDate = Moment(state.endDate)
                      .add(1, "w")
                      .format("YYYY-MM-DD");
                    const newTableColumns = prepareTableColumns(
                      newStartDate,
                      state.currentDate
                    );
                    this.setState({
                      endDate: newEndDate,
                      startDate: newStartDate,
                      tableColumns: newTableColumns
                    });
                    this.handleSpecialistSelect(
                      state.selectedSpecialistId,
                      newStartDate,
                      newEndDate
                    );
                  }}
                />
              </Fragment>
            ) : null}
          </Col>
        </Row>
        {state.selectedSpecialistId &&
        state.selectedSpecialistId !== "-select-" ? (
          <Table
            bordered
            columns={state.tableColumns}
            dataSource={state.tableData}
            loading={state.loading}
            pagination={pagination}
            size="small"
          />
        ) : null}
        <EventCreateModal
          duration={state.duration}
          eventEndTime={state.eventEndTime}
          eventStartTime={state.eventStartTime}
          handleCreateEvent={this.handleCreateEvent}
          patient={state.patient}
          productList={productList}
          selectedProductId={state.selectedProductId}
          selectedSpecialistId={state.selectedSpecialistId}
          smsKeys={state.smsKeys}
          specialistList={specialistList}
          updateState={this.updateState}
          visible={state.visible}
        />
        {state.patient.PATIENT_ID === 0 && (
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
