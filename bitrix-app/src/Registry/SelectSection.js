import React from "react";
import { array, func, string } from "prop-types";
import { Col, Select } from "antd";

const Option = Select.Option;

export const SelectSection = ({
  handleSectionSelect,
  sections,
  selectedSectionId
}) => {
  const sectionOptions = [
    <Option key="select-section" value="-select-" disabled>
      -выберите категорию-
    </Option>
  ];
  if (Array.isArray(sections) && sections.length) {
    sections.forEach(section => {
      sectionOptions.push(
        <Option key={`opt-${section.ID}`} value={section.ID}>
          {section.NAME}
        </Option>
      );
    });
  }
  const SECTIONS = (
    <Select
      defaultValue="-select-"
      disabled={Array.isArray(sections) && sections.length ? false : true}
      onChange={val => handleSectionSelect(val)}
      size="small"
      style={{ width: "100%", marginRight: "0.5em" }}
      value={selectedSectionId}
    >
      {sectionOptions}
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
      {SECTIONS}
    </Col>
  );
};

SelectSection.propTypes = {
  handleSectionSelect: func.isRequired,
  sections: array.isRequired,
  selectedSectionId: string
};
