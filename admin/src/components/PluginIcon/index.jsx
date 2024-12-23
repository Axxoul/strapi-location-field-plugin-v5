import React from "react";
import styled from "styled-components";
import { Flex } from "@strapi/design-system";
import { PinMap } from "@strapi/icons";

const IconBox = styled(Flex)`
    background-color: #f0f0ff;
    border: 1px solid #d9d8ff;
    svg > path {
        fill: #4285f4;
    }
`;

const MapPickerIcon = () => {
    return (
        <IconBox justifyContent="center" alignItems="center" width={7} height={6} hasRadius aria-hidden>
            <PinMap />
        </IconBox>
    );
};

export default MapPickerIcon;