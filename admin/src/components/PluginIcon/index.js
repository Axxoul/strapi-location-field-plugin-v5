import React from "react";
import styled from "styled-components";
import { Icon } from "@strapi/design-system/Icon";
import { PinMap } from "@strapi/icons";

const IconBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px; /* Equivalent to 7 * 4px */
  height: 24px; /* Equivalent to 6 * 4px */
  border-radius: 4px; /* Use a specific radius value */
  background-color: #f0f0ff;
  border: 1px solid #d9d8ff;

  svg > path {
    fill: #4285f4;
  }
`;

const MapPickerIcon = () => {
  return (
    <IconBox aria-hidden>
      <Icon as={PinMap} />
    </IconBox>
  );
};

export default MapPickerIcon;
