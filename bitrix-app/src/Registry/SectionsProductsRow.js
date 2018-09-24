import React from "react";
import { array, func, string } from "prop-types";
import { Row } from "antd";
import { SelectSection } from "./SelectSection";
import { SelectProduct } from "./SelectProduct";

export const SectionsProductsRow = ({
  handleProductSelect,
  handleSectionSelect,
  products,
  sections,
  selectedProductId,
  selectedSectionId
}) => (
  <Row>
    <SelectSection
      handleSectionSelect={handleSectionSelect}
      sections={sections}
      selectedSectionId={selectedSectionId}
    />
    <SelectProduct
      handleProductSelect={handleProductSelect}
      products={products}
      selectedProductId={selectedProductId}
    />
  </Row>
);

SectionsProductsRow.propTypes = {
  handleProductSelect: func.isRequired,
  handleSectionSelect: func.isRequired,
  products: array.isRequired,
  sections: array.isRequired,
  selectedProductId: string,
  selectedSectionId: string
};
