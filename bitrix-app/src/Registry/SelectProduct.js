import React from "react";
import { array, func, string } from "prop-types";
import { Col, Select } from "antd";

const Option = Select.Option;

export const SelectProduct = ({
  handleProductSelect,
  products,
  selectedProductId
}) => {
  let productOptions = [
    <Option key="select-product" value="-select-" disabled>
      -выберите категорию-
    </Option>
  ];
  if (Array.isArray(products) && products.length) {
    products.forEach(product => {
      productOptions.push(
        <Option
          key={`opt-${product.ID}`}
          title={product.NAME}
          value={product.ID}
        >
          {product.NAME}
        </Option>
      );
    });
  }
  const PRODUCTS = (
    <Select
      defaultValue="-select-"
      disabled={Array.isArray(products) && products.length ? false : true}
      onChange={val => handleProductSelect(val)}
      size="small"
      style={{ width: "100%", marginRight: "0.5em" }}
      value={selectedProductId}
    >
      {productOptions}
    </Select>
  );
  return (
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
  );
};

SelectProduct.propTypes = {
  handleProductSelect: func.isRequired,
  products: array.isRequired,
  selectedProductId: string
};
