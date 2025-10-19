// ...other imports above remain unchanged
import type { ThresholdConfig } from "@pomatez/shareables";
import type { TimerState } from "@pomatez/shareables";

// ...existing code above

// New Threshold IPC handlers
ipcMain.on(SET_THRESHOLD_CONFIG, (e, config: ThresholdConfig | null) => {
  currentThresholdConfig = config;
  store.safeSet("thresholdConfig", config);
  
  if (thresholdTrayManager) {
    thresholdTrayManager.updateThresholdConfig(config ?? null);
  }
});

ipcMain.handle(GET_THRESHOLD_CONFIG, () => {
  const saved = store.safeGet("thresholdConfig");
  const cfg = (saved ?? null) as ThresholdConfig | null;
  currentThresholdConfig = cfg;
  return cfg;
});

ipcMain.on(THRESHOLD_NOTIFICATION, (e, data) => {
  showThresholdNotification(data);
});

ipcMain.on(TIMER_THRESHOLD_UPDATE, (e, state: TimerState) => {
  currentTimerState = state;
  
  if (thresholdTrayManager && currentThresholdConfig) {
    thresholdTrayManager.updateTimerState(state);
  }
});

ipcMain.on(RESET_THRESHOLD_STATE, () => {
  currentTimerState = null;
  
  if (thresholdTrayManager) {
    thresholdTrayManager.reset();
  }
});
