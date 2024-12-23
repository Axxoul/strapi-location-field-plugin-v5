import React, { useState, useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { NumberInput, Box, Combobox, ComboboxOption } from "@strapi/design-system";

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
  const [autocompletionRequestOptions, setAutocompletionRequestOptions] = useState(null);
  const [textValue, setTextValue] = useState(
    value && value !== "null" ? JSON.parse(value).description : ""
  );
  const [predictions, setPredictions] = useState([]);

  const fetchConfig = async (signal) => {
    const response = await fetch("/location-field/config", { method: "GET", signal });
    if (!response.ok) throw new Error("Failed to fetch configuration");
    const config = await response.json();
    return config;
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchConfig(abortController.signal)
      .then(({ googleMapsApiKey, fields, autocompletionRequestOptions }) => {
        setApiKey(googleMapsApiKey);
        setFields(fields.includes("geometry") ? fields : [...fields, "geometry"]);
        setAutocompletionRequestOptions(autocompletionRequestOptions);
      })
      .catch((err) => console.error(err));

    return () => abortController.abort();
  }, []);

  useEffect(() => {
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
    const inputValue = e.target.value;
    setTextValue(inputValue);

    if (!inputValue) {
      setPredictions([]);
      setLocationValue(null);
      return;
    }

    loader.load().then((google) => {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: inputValue, ...autocompletionRequestOptions },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setPredictions(results || []);
          }
        }
      );
    });
  };

  const setLocationValue = (placeId) => {
    if (!placeId) {
      setTextValue("");
      onChange({ target: { name, value: null, type: attribute.type } });
      return;
    }

    const selectedPrediction = predictions.find((pred) => pred.place_id === placeId);

    if (selectedPrediction) {
      setTextValue(selectedPrediction.description);

      loader.load().then((google) => {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.getDetails(
          { placeId: selectedPrediction.place_id, fields },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              const locationData = JSON.stringify({
                description: selectedPrediction.description,
                place_id: selectedPrediction.place_id,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });

              onChange({ target: { name, value: locationData, type: attribute.type } });
            }
          }
        );
      });
    }
  };

  const setCoordinates = (coordinate, type) => {
    const currentValue = value && value !== "null" ? JSON.parse(value) : {};
    const updatedValue = { ...currentValue, [type]: coordinate || null };
    onChange({ target: { name, value: JSON.stringify(updatedValue), type: attribute.type } });
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
            value={value && value !== "null" ? JSON.parse(value).place_id : ""}
            textValue={textValue}
            onClear={() => setLocationValue(null)}
          >
            {predictions.map((prediction) => (
              <ComboboxOption key={prediction.place_id} value={prediction.place_id}>
                {prediction.description}
              </ComboboxOption>
            ))}
          </Combobox>
        )}
      </Box>

      {value && JSON.parse(value).place_id === "custom_location" && (
        <Box display="flex" gap={2}>
          <NumberInput
            label="Latitude"
            name="latitude"
            placeholder="Ex. 43.123456"
            disabled={disabled}
            onValueChange={(val) => setCoordinates(val, "lat")}
            value={value && value !== "null" ? JSON.parse(value).lat : ""}
          />
          <NumberInput
            label="Longitude"
            name="longitude"
            placeholder="Ex. -79.123456"
            disabled={disabled}
            onValueChange={(val) => setCoordinates(val, "lng")}
            value={value && value !== "null" ? JSON.parse(value).lng : ""}
          />
        </Box>
      )}
    </Box>
  );
}

Input.defaultProps = {
  value: "null",
};
