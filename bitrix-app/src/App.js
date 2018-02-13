/* global BX24 */
import React, { Component } from "react";
import Moment from "moment";
import {
  Button,
  Col,
  Icon,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Table,
  Tag
} from "antd";
import { Aux, prepareCellEntries, prepareTableData } from "./Utils";

const Option = Select.Option;

class App extends Component {
  state = {
    currentDate: Moment().format("YYYY-MM-DD"),
    duration: "",
    events: [],
    fetchServices: false,
    loading: false,
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
      let leadId = 0;
      const info = BX24.placement.info();
      if (
        info.placement === "CRM_LEAD_LIST_MENU" ||
        info.placement === "CRM_LEAD_DETAIL_TAB"
      ) {
        leadId = info.options.ID;
      }
      const tableColumns = this.prepareTableColumns(
        this.state.startDate,
        this.state.currentDate
      );
      const tableData = prepareTableData(this.handleShowModal);
      this.setState({ leadId, tableColumns, tableData });
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
          // console.error(result.error());
        } else {
          const sections = result.data();
          if (sections.length) {
            this.setState({ sections });
          } else {
            this.getSectionProductList();
          }
          //if(result.more())
          //  result.next();
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
        //if(result.more())
        //  result.next();
      }
    });
  };

  /**
   * @param {string} current
   * @param {string} start
   * готовит заголовок таблицы
   */
  prepareTableColumns = (start, current) => {
    let result = [];
    result.push({
      title: <Icon type="clock-circle-o" />,
      dataIndex: "time",
      key: "time",
      className: "app-table-class-name"
    });
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
   * @param {Array} events
   * заполняем строки таблицы событиями
   */
  prepareTableDataWithEvents = events => {
    let result = [];
    const start_hour = 8;
    let i = 0;
    this.state.tableData.forEach(row => {
      let newRow = {
        key: row.key,
        time: row.time
      };
      const hour_from = start_hour + i;
      let rowTime = (hour_from < 10 ? "0" + hour_from : hour_from) + ":00:00";
      Object.keys(row).forEach(cell => {
        switch (cell) {
          case "пн": {
            const cellStartDate = Moment(
              Moment(this.state.startDate)
                .startOf("week")
                .format("YYYY-MM-DD") +
                " " +
                rowTime
            );
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              this.handleShowModal
            );
            break;
          }
          case "вт": {
            const cellStartDate = Moment(
              Moment(this.state.startDate)
                .startOf("week")
                .add(1, "days")
                .format("YYYY-MM-DD") +
                " " +
                rowTime
            );
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              this.handleShowModal
            );
            break;
          }
          case "ср": {
            const cellStartDate = Moment(
              Moment(this.state.startDate)
                .startOf("week")
                .add(2, "days")
                .format("YYYY-MM-DD") +
                " " +
                rowTime
            );
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              this.handleShowModal
            );
            break;
          }
          case "чт": {
            const cellStartDate = Moment(
              Moment(this.state.startDate)
                .startOf("week")
                .add(3, "days")
                .format("YYYY-MM-DD") +
                " " +
                rowTime
            );
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              this.handleShowModal
            );
            break;
          }
          case "пт": {
            const cellStartDate = Moment(
              Moment(this.state.startDate)
                .startOf("week")
                .add(4, "days")
                .format("YYYY-MM-DD") +
                " " +
                rowTime
            );
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              this.handleShowModal
            );
            break;
          }
          case "сб": {
            const cellStartDate = Moment(
              Moment(this.state.startDate)
                .startOf("week")
                .add(5, "days")
                .format("YYYY-MM-DD") +
                " " +
                rowTime
            );
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              this.handleShowModal
            );
            break;
          }
          case "вс": {
            const cellStartDate = Moment(
              Moment(this.state.startDate)
                .startOf("week")
                .add(6, "days")
                .format("YYYY-MM-DD") +
                " " +
                rowTime
            );
            newRow[cell] = prepareCellEntries(
              cellStartDate,
              events,
              this.handleShowModal
            );
            break;
          }
          default:
        }
      });
      result.push(newRow);
      i++;
    });
    return result;
  };

  /**
   * @param {Array} data
   * получает массив id сотрудников и возвращает массив объектов с id и name сотрудника
   */
  prepareSpecialistByProduct = data => {
    let result = [];
    this.state.users.forEach(user => {
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
                  specialists: this.prepareSpecialistByProduct(specialists)
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
                  specialists: this.prepareSpecialistByProduct(specialists)
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
          const events = result.data();
          if (events && events.length) {
            const tableData = this.prepareTableDataWithEvents(events);
            this.setState({ loading: false, events, tableData });
          } else {
            this.setState({ loading: false });
          }
        }
      }
    );
  };

  handleShowModal = () => {
    this.setState({ visible: true });
  };

  render() {
    const {
      currentDate,
      duration,
      endDate,
      loading,
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
    const pagination = {
      hideOnSinglePage: true,
      pageSize: 12
    };

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
    if (products.length) {
      specialists.forEach(specialist => {
        specialistOptions.push(
          <Option key={"opt-" + specialist.ID} value={specialist.ID}>
            {specialist.NAME}
          </Option>
        );
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
                    const newTableColumns = this.prepareTableColumns(
                      newStartDate,
                      currentDate
                    );
                    this.setState({
                      endDate: newEndDate,
                      startDate: newStartDate,
                      tableColumns: newTableColumns
                    });
                    this.handleSpecialistSelect(selectedSpecialistId, newStartDate, newEndDate);
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
                    const newTableColumns = this.prepareTableColumns(
                      newStartDate,
                      currentDate
                    );
                    this.setState({
                      endDate: newEndDate,
                      startDate: newStartDate,
                      tableColumns: newTableColumns
                    });
                    this.handleSpecialistSelect(selectedSpecialistId, newStartDate, newEndDate);
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
          <Input value={duration} />
        </Modal>
      </div>
    );
  }
}

export default App;
