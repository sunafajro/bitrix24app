/* global BX24 */
import React, { Component } from "react";
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
  Select,
  Table,
  TimePicker
} from "antd";
import {
  Aux,
  prepareSpecialistByProduct,
  prepareTableColumns,
  prepareTableDataWithEvents
} from "./PrepareFunctions";

const Option = Select.Option;
const DISABLED_HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 20, 21, 22, 23];

class App extends Component {
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
    smsApiKey: "",
    smsAuthKey: "",
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

  componentWillMount() {
    BX24.init(() => {
      let contactId = 0;
      let leadId = 0;
      const info = BX24.placement.info();
      let type;
      let timerange = [];
      for (let h = 15; h < 19; h++) {
        for (let m = 0; m < 60; m = m + 5) {
          timerange.push(h + ":" + (m < 10 ? "0" + m : m) + ":00");
        }
      }
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
      const tableColumns = prepareTableColumns(
        this.state.startDate,
        this.state.currentDate
      );
      if (type) {
        BX24.callMethod(
          type,
          { id: type === "crm.lead.get" ? leadId : contactId },
          result => {
            if (result.error()) {
              notification.open({
                duration: 2,
                description: "Ошибка получения идентификатора пациента!"
              });
            } else {
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
              this.setState({
                contactId,
                leadId,
                patient,
                tableColumns,
                timerange
              });
            }
          }
        );
      } else {
        this.setState({ tableColumns, timerange });
      }
    });
  }

  componentDidMount() {
    this.getProductSectionList();
    this.getUsers();
    this.getAppParams();
  }

  sendSms = () => {
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
    if (number && message && this.state.smsApiKey && this.state.smsAuthKey) {
      axios
        .post(`/send-sms.php`, {
          auth_key: this.state.smsAuthKey,
          number: number,
          message: message,
          api_key: this.state.smsApiKey
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

  /* получает список сотрудников */
  getUsers = () => {
    BX24.callMethod("user.get", {}, result => {
      if (result.error()) {
        notification.open({
          duration: 2,
          description: "Ошибка получения пользователей!"
        });
      } else {
        const rawUsers = result.data();
        let users = [];
        if (rawUsers && rawUsers.length) {
          users = rawUsers.map(user => {
            return {
              id: user.ID,
              firstName: user.NAME,
              lastName: user.LAST_NAME
            };
          });
        }
        if (users.length) {
          this.setState({ users });
        } else {
          notification.open({
            duration: 2,
            description: "Не найдено ни одного пользователя!"
          });
        }
      }
    });
  };

  getAppParams = () => {
    BX24.callMethod("entity.item.get", { ENTITY: "settings" }, result => {
      if (result.error()) {
        notification.open({
          duration: 2,
          description: "Ошибка получения параметров приложения!"
        });
      } else {
        const rawSettings = result.data();
        if (
          rawSettings.length &&
          rawSettings[0].hasOwnProperty("PROPERTY_VALUES")
        ) {
          this.setState({
            administrator: {
              id: rawSettings[0].PROPERTY_VALUES.userAdministratorId,
              name: rawSettings[0].PROPERTY_VALUES.userAdministratorName
            },
            smsApiKey: rawSettings[0].PROPERTY_VALUES.smsApiKey,
            smsAuthKey: rawSettings[0].PROPERTY_VALUES.smsAuthKey,
          });
        }
      }
    });
  };

  /* получает список разделов товаров */
  getProductSectionList = () => {
    let sections = [];
    BX24.callMethod(
      "crm.productsection.list",
      {
        order: { NAME: "ASC" }
        //filter: { "CATALOG_ID": catalogId },
        //select: [ "ID", "NAME", "CURRENCY_ID", "PRICE" ]
      },
      result => {
        if (result.error()) {
          notification.open({
            duration: 2,
            description: "Ошибка получения списка разделов услуг!"
          });
        } else {
          sections = sections.concat(result.data());
          if (result.more()) {
            result.next();
          } else {
            if (sections.length) {
              this.setState({ sections });
            } else {
              this.getSectionProductList();
            }
          }
        }
      }
    );
  };

  /**
   * @param {string} sectionId
   * получает список продуктов по выбранному разделу
   */
  getSectionProductList = (sectionId = null) => {
    let criteria = {
      order: { NAME: "ASC" },
      select: ["ID", "NAME", "DESCRIPTION", "CURRENCY_ID", "PRICE"]
    };
    if (sectionId) {
      criteria.filter = { SECTION_ID: sectionId };
    }
    let products = [];
    /* Возвращает список товаров по фильтру. */
    BX24.callMethod("crm.product.list", criteria, result => {
      if (result.error()) {
        notification.open({
          duration: 2,
          description: "Ошибка получения списка услуг!"
        });
      } else {
        products = products.concat(result.data());
        if (result.more()) {
          result.next();
        } else {
          this.setState({ products });
        }
      }
    });
  };

  /**
   * @param {string} val
   * вызвается при выборе раздела товаров
   */
  handleSectionSelect = val => {
    this.getSectionProductList(val);
    this.setState({
      events: [],
      selectedSectionId: val,
      selectedProductId: "-select-",
      selectedSpecialistId: "-select-",
      specialists: []
    });
  };

  /**
   * @param {string} val
   * вызвается при выборе раздела товаров
   */
  handleProductSelect = val => {
    /* Возвращает описание полей товара. */
    BX24.callMethod("crm.product.fields", {}, result => {
      if (result.error()) {
        notification.open({
          duration: 2,
          description: "Ошибка получения списка свойств услуг!"
        });
      } else {
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
        if (specialistProp && durationProp) {
          /* Возвращает товар по идентификатору. */
          BX24.callMethod("crm.product.get", { ID: val }, result => {
            if (result.error()) {
              notification.open({
                duration: 2,
                description: "Ошибка получения свойств выбранной услуги!"
              });
            } else {
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
              if (specialists.length && duration) {
                this.setState({
                  duration,
                  specialists: prepareSpecialistByProduct(
                    this.state.users,
                    specialists
                  )
                });
              } else if (!specialists.length && duration) {
                notification.open({
                  duration: 2,
                  description: "У услуги отсутсвует «Специалист»!"
                });
                this.setState({
                  duration
                });
              } else if (specialists.length && !duration) {
                notification.open({
                  duration: 2,
                  description: "У услуги отсутсвует «Продолжительность»!"
                });
                this.setState({
                  specialists: prepareSpecialistByProduct(
                    this.state.users,
                    specialists
                  )
                });
              } else {
                notification.open({
                  duration: 2,
                  description:
                    "У услуги отсутсвуют «Специалист» и «Продолжительность»!"
                });
              }
            }
          });
        } else {
          notification.open({
            duration: 2,
            description:
              "Поля «Специалист» или «Продолжительность» в списке полей услуги не найдено!"
          });
        }
      }
    });
    this.setState({
      events: [],
      selectedProductId: val,
      selectedSpecialistId: "-select-"
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
    let productList = {};
    let specialistList = {};

    let sectionOptions = [
      <Option key="select-section" value="-select-" disabled>
        -выберите категорию-
      </Option>
    ];
    if (sections.length) {
      sections.forEach(section => {
        sectionOptions.push(
          <Option key={"opt-" + section.ID} value={section.ID}>
            {section.NAME}
          </Option>
        );
      });
    }
    const SECTIONS = (
      <Select
        defaultValue="-select-"
        disabled={sections.length ? false : true}
        onChange={val => this.handleSectionSelect(val)}
        size="small"
        style={{ width: "100%", marginRight: "0.5em" }}
        value={selectedSectionId}
      >
        {sectionOptions}
      </Select>
    );

    let productOptions = [
      <Option key="select-product" value="-select-" disabled>
        -выберите категорию-
      </Option>
    ];
    if (products.length) {
      products.forEach(product => {
        productOptions.push(
          <Option
            key={"opt-" + product.ID}
            title={product.NAME}
            value={product.ID}
          >
            {product.NAME}
          </Option>
        );
        productList[product.ID] = product.NAME;
      });
    }
    const PRODUCTS = (
      <Select
        defaultValue="-select-"
        disabled={products.length ? false : true}
        onChange={val => this.handleProductSelect(val)}
        size="small"
        style={{ width: "100%", marginRight: "0.5em" }}
        value={selectedProductId}
      >
        {productOptions}
      </Select>
    );

    let specialistOptions = [
      <Option key="select-specialist" value="-select-" disabled>
        -выберите специалиста-
      </Option>
    ];
    if (specialists.length) {
      specialists.forEach(specialist => {
        specialistOptions.push(
          <Option key={"opt-" + specialist.ID} value={specialist.ID}>
            {specialist.NAME}
          </Option>
        );
        specialistList[specialist.ID] = specialist.NAME;
      });
    }
    const SPECIALISTS = (
      <Select
        defaultValue="-select-"
        disabled={specialists.length ? false : true}
        onChange={val => this.handleSpecialistSelect(val, startDate, endDate)}
        size="small"
        style={{ width: "100%", marginRight: "0.5em" }}
        value={selectedSpecialistId}
      >
        {specialistOptions}
      </Select>
    );

    return (
      <div style={{ padding: "5px", marginBottom: "1em" }}>
        <Row>
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 8 }}
            lg={{ span: 8 }}
            xl={{ span: 8 }}
            xxl={{ span: 8 }}
            style={{ paddingRight: "5px", marginBottom: "0.5em" }}
          >
            {SECTIONS}
          </Col>
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 16 }}
            lg={{ span: 16 }}
            xl={{ span: 16 }}
            xxl={{ span: 16 }}
            style={{ paddingRight: "5px", marginBottom: "0.5em" }}
          >
            {PRODUCTS}
          </Col>
        </Row>
        <Row>
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 8 }}
            lg={{ span: 8 }}
            xl={{ span: 8 }}
            xxl={{ span: 8 }}
            style={{ paddingRight: "5px", marginBottom: "0.5em" }}
          >
            {SPECIALISTS}
          </Col>
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

export default App;
