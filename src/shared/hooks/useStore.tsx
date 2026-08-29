import { StoreContext } from "../context/storeContext";
import * as React from "react";

const useStore = () => {
  const { config, locations, postals, settings, setConfig, setLocations, setSettings } =
    React.useContext(StoreContext);

  return {
    config,
    locations,
    postals,
    settings,
    setConfig,
    setLocations,
    setSettings,
  };
};

export default useStore;
