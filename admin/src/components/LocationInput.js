import React, { useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

import { NumberInput, Box } from "@strapi/design-system";
import { Combobox } from "@strapi/design-system";
import { ComboboxOption } from "@strapi/design-system";
import { request } from "@strapi/helper-plugin";

export default function Input({
  onChange,
  value,
  disabled,
  name,
  attribute,
  error,
  required,
}) {
  const [apiKey, setApiKey] = useState(null);
  const [fields, setFields] = useState(null);
  const [loader, setLoader] = useState(null);
  const [autocompletionRequestOptions, setAutocompletionRequestOptions] =
    useState(null);
  const [textValue, setTextValue] = useState(
    "" || (value !== "null" ? JSON.parse(value).description : "")
  );

  const [predictions, setPredictions] = useState([]);

  // Fetch config details
  React.useEffect(() => {
    const fetchConfig = async () => {
      const { signal } = new AbortController();
      const { fields, autocompletionRequestOptions, googleMapsApiKey } =
        await request("/location-field/config", {
          method: "GET",
          signal,
        });

      setApiKey(googleMapsApiKey);
      setFields(fields?.includes("geometry") ? fields : [...(fields || []), "geometry"]);
      setAutocompletionRequestOptions(autocompletionRequestOptions);
    };

    fetchConfig();
  }, []);

  // Initialize Google Maps Loader
  React.useEffect(() => {
    if (apiKey) {
      const loaderInstance = new Loader({
        apiKey,
        version: "weekly",
        libraries: ["places"],
      });
      setLoader(loaderInstance);
    }
  }, [apiKey]);

  const handleInputChange = (e) => {
    setTextValue(e.target.value);

    if (!e.target.value) {
      setPredictions([]);
      setLocationValue("");
      return;
    }

    loader.load().then((google) => {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: e.target.value, ...autocompletionRequestOptions },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setPredictions(predictions || []);
          }
        }
      );
    });
  };

  const setLocationValue = (val) => {
    if (!val) {
      setTextValue("");
      onChange({ target: { name, value: null, type: attribute.type } });
      return;
    }

    const selectedPrediction = predictions.find(
      (prediction) => prediction.place_id === val
    );

    if (selectedPrediction) {
      setTextValue(selectedPrediction.description);
      loader.load().then((google) => {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.getDetails(
          { placeId: selectedPrediction.place_id, fields },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              const valueToSave = JSON.stringify({
                description: selectedPrediction.description,
                place_id: selectedPrediction.place_id,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });

              onChange({ target: { name, value: valueToSave, type: attribute.type } });
            }
          }
        );
      });
    }
  };

  const setCoordinates = (val, type) => {
    const parsedValue = value !== "null" ? JSON.parse(value) : {};
    const updatedValue = { ...parsedValue, [type]: val || null };

    onChange({
      target: {
        name,
        value: JSON.stringify(updatedValue),
        type: attribute.type,
      },
    });
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={3}>
      <Box width="100%">
        {loader && apiKey && fields && (
          <Combobox
            label="Location"
            name="location"
            error={error}
            required={required}
            disabled={disabled}
            placeholder="Ex. 123 Street, Niagara Falls, ON"
            onChange={setLocationValue}
            onInputChange={handleInputChange}
            value={value !== "null" && value ? JSON.parse(value).place_id : ""}
            textValue={textValue}
            onClear={() => setLocationValue("")}
          >
            {predictions.map((prediction) => (
              <ComboboxOption key={prediction.place_id} value={prediction.place_id}>
                {prediction.description}
              </ComboboxOption>
            ))}
          </Combobox>
        )}
      </Box>

      {value !== "null" && JSON.parse(value).place_id === "custom_location" && (
        <Box display="flex" gap={2}>
          <NumberInput
            label="Latitude"
            name="latitude"
            placeholder="Ex. 43.123456"
            disabled={disabled}
            onValueChange={(e) => setCoordinates(e, "lat")}
            value={value !== "null" ? JSON.parse(value).lat : ""}
          />
          <NumberInput
            label="Longitude"
            name="longitude"
            placeholder="Ex. -79.123456"
            disabled={disabled}
            onValueChange={(e) => setCoordinates(e, "lng")}
            value={value !== "null" ? JSON.parse(value).lng : ""}
          />
        </Box>
      )}
    </Box>
  );
}

Input.defaultProps = {
  value: "null",
};
