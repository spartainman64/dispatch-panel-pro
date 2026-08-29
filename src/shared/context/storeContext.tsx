import * as React from "react";
import {
  ConfigType,
  SettingsType,
  LocationConfig,
  PostalConfig,
} from "../../config";

type Store = {
  config: ConfigType;
  locations: LocationConfig[];
  postals: PostalConfig[];
  settings: SettingsType;
  setConfig: (config: ConfigType) => void;
  setLocations: (locations: LocationConfig[]) => void;
  setPostals: (postals: PostalConfig[]) => void;
  setSettings: (settings: SettingsType) => void;
};

export const StoreContext = React.createContext<Store>(null);

export const StoreContextProvider = (props: React.PropsWithChildren) => {
  const setConfig = (config: ConfigType) => {
    setStore((prev) => ({ ...prev, config }));
    window.electron.store.set("config", "config", config);
  };

  const setLocations = (locations: LocationConfig[]) => {
    setStore((prev) => ({ ...prev, locations }));
    window.electron.store.set("config", "config", locations);
  };

  const setPostals = (postals: PostalConfig[]) => {
    setStore((prev) => ({ ...prev, postals }));
    window.electron.store.set("config", "config", postals);
  };

  const setSettings = (settings: SettingsType) => {
    setStore((prev) => ({ ...prev, settings }));
    window.electron.store.set("settings", "config", settings);
  };

  const [store, setStore] = React.useState<Store>({
    config: null,
    locations: null,
    postals: null,
    settings: null,
    setConfig: setConfig,
    setLocations: setLocations,
    setPostals: setPostals,
    setSettings: setSettings,
  });

  React.useEffect(() => {
    window.electron.store.get("config", "config").then((config: ConfigType) => {
      setStore((prev) => ({ ...prev, config }));
    });
    window.electron.store
      .get("locations", "config")
      .then((locations: LocationConfig[]) => {
        setStore((prev) => ({ ...prev, locations }));
      });
    window.electron.store
      .get("postals", "config")
      .then((postals: PostalConfig[]) => {
        setStore((prev) => ({ ...prev, postals }));
      });
    window.electron.store
      .get("settings", "config")
      .then((settings: SettingsType) => {
        setStore((prev) => ({ ...prev, settings }));
      });
  }, []);

  return (
    <StoreContext.Provider value={store}>
      {store.config && store.locations && store.postals && store.settings ? (
        <React.Fragment>{props.children}</React.Fragment>
      ) : (
        <React.Fragment></React.Fragment>
      )}
    </StoreContext.Provider>
  );
};
