import * as React from "react";
import { ControllerDataContext } from "../context/controllerDataContext";

const useControllerData = () => {
  return React.useContext(ControllerDataContext);
};

export default useControllerData;
