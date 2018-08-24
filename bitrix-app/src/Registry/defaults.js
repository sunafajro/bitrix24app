import { administrator, smsKeys } from "../defaults";
import Moment from "moment";

export const DISABLED_HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 20, 21, 22, 23];

export const defaultState = {
  administrator: { ...administrator },
  contactId: 0,
  currentDate: Moment().format("YYYY-MM-DD"),
  duration: "",
  events: [],
  eventStartTime: Moment(),
  eventEndTime: Moment(),
  fetchServices: false,
  initLoading: true,
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
  smsKeys: { ...smsKeys },
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
