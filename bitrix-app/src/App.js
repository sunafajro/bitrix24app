/* global BX24 */
import React, { Component } from "react";
import Moment from "moment";
import {
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
  prepareTableData,
  prepareTableDataWithEvents
} from "./PrepareFunctions";

const Option = Select.Option;

class App extends Component {
  state = {
    contactId: 0,
    currentDate: Moment().format("YYYY-MM-DD"),
    duration: "",
    events: [],
    eventStartTime: Moment(),
    fetchServices: false,
    leadId: 0,
    loading: false,
    patient: {
      PATIENT_NAME: "",
      PATIENT_TYPE: "",
      PATIENT_ID: 0
    },
    products: [],
    selectedProductId: "-select-",
    selectedSectionId: "-select-",
    selectedSpecialistId: "-select-",
    sections: [],
    showTable: false,
    specialists: [],
    startDate: Moment()
      .startOf("week")
      .format("YYYY-MM-DD"),
    endDate: Moment()
      .endOf("week")
      .format("YYYY-MM-DD"),
    tableColumns: [],
    tableData: [],
    users: [],
    visible: false
  };

  componentWillMount() {
    BX24.init(() => {
      let contactId = 0;
      let leadId = 0;
      const info = BX24.placement.info();
      let type;
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
                PATIENT_ID: patientData.ID
              };
              this.setState({ contactId, leadId, patient, tableColumns });
            }
          }
        );
      } else {
        this.setState({ tableColumns });
      }
    });
  }

  componentDidMount() {
    this.getProductSectionList();
    this.getUsers();
  }

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

  /* получает список разделов товаров */
  getProductSectionList = () => {
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
          const sections = result.data();
          if (sections.length) {
            this.setState({ sections });
          } else {
            this.getSectionProductList();
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
    /* Возвращает список товаров по фильтру. */
    BX24.callMethod("crm.product.list", criteria, result => {
      if (result.error()) {
        notification.open({
          duration: 2,
          description: "Ошибка получения списка услуг!"
        });
      } else {
        const products = result.data();
        this.setState({ products });
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
              const duration = rawProductData[durationProp].value;
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
      loading: true,
      events: [],
      selectedSpecialistId: id,
      tableData: prepareTableData(this.handleShowModal)
    });
    /* Возвращает список событий календаря. */
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
              const deals = result.data();
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
              if (items && items.length) {
                prepareTableDataWithEvents(
                  this.handleShowModal,
                  items,
                  this.state.startDate,
                  this.state.tableData,
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
                        tableData: result
                      });
                    }
                  }
                );
              } else {
                this.setState({ loading: false });
              }
            }
          );
        }
      }
    );
  };

  handleShowModal = date => {
    this.setState({ eventStartTime: date, visible: true });
  };

  render() {
    const {
      currentDate,
      duration,
      endDate,
      eventStartTime,
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
          <Option key={"opt-" + product.ID} value={product.ID}>
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
      <div style={{ marginBottom: "1em" }}>
        <Row style={{ marginBottom: "0.5em" }}>
          <Col span={6}>{SECTIONS}</Col>
          <Col span={6}>{PRODUCTS}</Col>
          <Col span={6}>{SPECIALISTS}</Col>
          <Col span={6} style={{ textAlign: "right" }}>
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
          onOk={() => this.setState({ visible: false })}
          title="Добавить событие"
          visible={visible}
        >
          <div style={{ marginBottom: "5px" }}>
            <b>Время:</b>
            <Row>
              <Col span={8}>
                <TimePicker
                  format={timeFormat}
                  onChange={time => this.setState({ eventStartTime: time })}
                  value={Moment(eventStartTime)}
                />
              </Col>
              <Col span={8}>
                <Input disabled={true} value={duration} />
              </Col>
              <Col span={8} style={{ textAlign: "right" }}>
                <TimePicker
                  disabled={true}
                  format={timeFormat}
                  value={Moment(eventStartTime).add(duration, "minutes")}
                />
              </Col>
            </Row>
          </div>
          <div style={{ marginBottom: "5px" }}>
            <b>Услуга:</b>
            <Input disabled={true} value={productList[selectedProductId]} />
          </div>
          <div style={{ marginBottom: "5px" }}>
            <b>Специалист:</b>
            <Input
              disabled={true}
              value={specialistList[selectedSpecialistId]}
            />
          </div>
          <div style={{ marginBottom: "5px" }}>
            <b>Клиент:</b>
            <Input disabled={true} value={patient.PATIENT_NAME} />
          </div>
        </Modal>
      </div>
    );
  }
}

export default App;
