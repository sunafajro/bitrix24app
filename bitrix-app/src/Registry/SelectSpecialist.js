import React from "react";
import { array, func, string } from "prop-types";
import { Col, Select } from "antd";

const Option = Select.Option;

export const SelectSpecialist = ({
  endDate,
  handleSpecialistSelect,
  specialists,
  selectedSpecialistId,
  startDate
}) => {
  let specialistOptions = [
    <Option key="select-specialist" value="-select-" disabled>
      -выберите специалиста-
    </Option>
  ];
  if (Array.isArray(specialists) && specialists.length) {
    specialists.forEach(specialist => {
      specialistOptions.push(
        <Option key={`opt-${specialist.ID}`} value={specialist.ID}>
          {specialist.NAME}
        </Option>
      );
    });
  }
  const SPECIALISTS = (
    <Select
      defaultValue="-select-"
      disabled={Array.isArray(specialists) && specialists.length ? false : true}
      onChange={val => handleSpecialistSelect(val, startDate, endDate)}
      size="small"
      style={{ width: "100%", marginRight: "0.5em" }}
      value={selectedSpecialistId}
    >
      {specialistOptions}
    </Select>
  );
  return (
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
  );
};

SelectSpecialist.propTypes = {
  handleSpecialistSelect: func.isRequired,
  specialists: array.isRequired,
  selectedSpecialistId: string
};
