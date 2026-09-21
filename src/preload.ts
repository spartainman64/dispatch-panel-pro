// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  store: {
    get: async (store: string, val: string) =>
      ipcRenderer.invoke("electron-store-get", store, val),
    set: (store: string, property: string, val: Object) =>
      ipcRenderer.invoke("electron-store-set", store, property, val),
  },
  reload: () => ipcRenderer.invoke("reload"),
  openConfigDir: () => ipcRenderer.invoke("open-config-dir"),
  openEventLogWindow: () => ipcRenderer.invoke("open-event-log-window"),
  pickSoundFile: () => ipcRenderer.invoke("pick-sound-file"),
  readSoundFileAsDataUrl: (path: string) => ipcRenderer.invoke("read-sound-file-as-data-url", path),
  backupConfiguration: () => ipcRenderer.invoke("backup-configuration"),
  restoreConfiguration: () => ipcRenderer.invoke("restore-configuration"),
  ts3: {
    move: (buttonKey: string) => ipcRenderer.invoke("ts3-move", buttonKey),
    channelList: () => ipcRenderer.invoke("ts3-channellist"),
    getPendingCounts: () => ipcRenderer.invoke("ts3-pending-counts"),
    onPendingCountsUpdate: (
      callback: (result: { counts: Record<string, number>; dispatcherPresent: Record<string, boolean> }) => void
    ) => {
      const listener = (
        _event: unknown,
        result: { counts: Record<string, number>; dispatcherPresent: Record<string, boolean> }
      ) => callback(result);
      ipcRenderer.on("ts3-pending-counts-push", listener);
      return () => {
        ipcRenderer.removeListener("ts3-pending-counts-push", listener);
      };
    },
    getCallerContext: () => ipcRenderer.invoke("ts3-caller-context"),
    pokeClient: (clientId: string, message: string) => ipcRenderer.invoke("ts3-poke", clientId, message),
    debugClientList: () => ipcRenderer.invoke("ts3-debug-clientlist"),
    listCivilians: () => ipcRenderer.invoke("ts3-list-civilians"),
    moveCivilian: (targetClientId: string, buttonKey: string) =>
      ipcRenderer.invoke("ts3-move-civilian", targetClientId, buttonKey),
    onMessageReceived: (
      callback: (message: { sender: string; message: string; timestamp: string }) => void
    ) => {
      const listener = (
        _event: unknown,
        message: { sender: string; message: string; timestamp: string }
      ) => callback(message);
      ipcRenderer.on("ts3-message-received", listener);
      return () => {
        ipcRenderer.removeListener("ts3-message-received", listener);
      };
    },
  },
});
