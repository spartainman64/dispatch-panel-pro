import { createRoot } from "react-dom/client";
import Theme from "../shared/components/theme";
import { SonoranWebSocketProvider } from "./context/sonoranWebSocketContext";
import { ControllerDataProvider } from "./context/controllerDataContext";
import { StoreContextProvider } from "../shared/context/storeContext";
import ConfiguredApp from "./components/configuredApp";
import EventLogWindow from "./components/eventLogWindow";

declare global {
  interface Window {
    electron: {
      store: {
        get: (store: string, key: string) => any;
        set: (store: string, key: string, val: any) => void;
      };
      reload: () => void;
      openConfigDir: () => void;
      openEventLogWindow: () => void;
      pickSoundFile: () => Promise<string | null>;
      backupConfiguration: () => Promise<{ success: boolean; message: string }>;
      restoreConfiguration: () => Promise<{ success: boolean; message: string }>;
      ts3: {
        move: (buttonKey: string) => Promise<{ success: boolean; message: string; data: string[] }>;
        channelList: () => Promise<{ success: boolean; message: string; data: string[] }>;
        getPendingCounts: () => Promise<{
          success: boolean;
          counts: Record<string, number>;
          dispatcherPresent: Record<string, boolean>;
        }>;
        onPendingCountsUpdate: (
          callback: (result: {
            counts: Record<string, number>;
            dispatcherPresent: Record<string, boolean>;
          }) => void
        ) => () => void;
        getCallerContext: () => Promise<{
          success: boolean;
          status: "rto" | "call" | "other";
          label: string;
          callers: { id: string; nickname: string }[];
        }>;
        pokeClient: (clientId: string, message: string) => Promise<{ success: boolean; message: string; data: string[] }>;
        listCivilians: () => Promise<{
          success: boolean;
          civilians: { id: string; nickname: string; channelName: string }[];
        }>;
        moveCivilian: (
          targetClientId: string,
          buttonKey: string
        ) => Promise<{ success: boolean; message: string; data: string[] }>;
        onMessageReceived: (
          callback: (message: { sender: string; message: string; timestamp: string }) => void
        ) => () => void;
        debugClientList: () => Promise<{
          success: boolean;
          clients: { id: string; channelId: string; nickname: string }[];
        }>;
      };
    };
  }
}

const isEventLogOnly = new URLSearchParams(window.location.search).get("view") === "eventlog";

const App = () => {
  return (
    <StoreContextProvider>
      <SonoranWebSocketProvider>
        <ControllerDataProvider>
          <Theme>{isEventLogOnly ? <EventLogWindow /> : <ConfiguredApp />}</Theme>
        </ControllerDataProvider>
      </SonoranWebSocketProvider>
    </StoreContextProvider>
  );
};

// get the root element
const root = createRoot(document.getElementById("root"));
root.render(<App />);
