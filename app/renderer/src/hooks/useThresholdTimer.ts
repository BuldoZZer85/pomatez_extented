import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ThresholdConfig,
  TimerState,
  ThresholdNotification,
  DEFAULT_THRESHOLD_CONFIG,
  checkThreshold,
  createThresholdNotificationText,
} from 'shareables';
import {
  SET_THRESHOLD_CONFIG,
  GET_THRESHOLD_CONFIG,
  THRESHOLD_NOTIFICATION,
  TIMER_THRESHOLD_UPDATE,
  RESET_THRESHOLD_STATE,
} from 'shareables';

interface UseThresholdTimerReturn {
  config: ThresholdConfig;
  timerState: TimerState;
  updateConfig: (newConfig: ThresholdConfig) => void;
  updateTimerState: (currentTime: number, sessionType: 'focus' | 'shortBreak' | 'longBreak', isRunning: boolean) => void;
  resetThresholdState: () => void;
  showNotification: (notification: ThresholdNotification) => void;
}

const useThresholdTimer = (): UseThresholdTimerReturn => {
  const [config, setConfig] = useState<ThresholdConfig>(DEFAULT_THRESHOLD_CONFIG);
  const [timerState, setTimerState] = useState<TimerState>({
    currentTime: 0,
    sessionType: 'focus',
    isRunning: false,
    minReached: false,
    maxReached: false,
  });
  
  const lastNotificationTimeRef = useRef<number>(0);
  const notificationCooldownMs = 2000; // 2 секунды между уведомлениями

  // Загрузка конфигурации при инициализации
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await window.ipcRenderer.invoke(GET_THRESHOLD_CONFIG);
        if (savedConfig) {
          setConfig(savedConfig);
        }
      } catch (error) {
        console.error('Ошибка загрузки конфигурации пороговых значений:', error);
      }
    };

    loadConfig();
  }, []);

  // Обновление конфигурации
  const updateConfig = useCallback((newConfig: ThresholdConfig) => {
    setConfig(newConfig);
    window.ipcRenderer.send(SET_THRESHOLD_CONFIG, newConfig);
  }, []);

  // Обновление состояния таймера
  const updateTimerState = useCallback(
    (currentTime: number, sessionType: 'focus' | 'shortBreak' | 'longBreak', isRunning: boolean) => {
      const newState: TimerState = {
        currentTime,
        sessionType,
        isRunning,
        minReached: timerState.minReached,
        maxReached: timerState.maxReached,
      };

      // Проверяем пороги только если таймер работает
      if (isRunning) {
        // Проверка минимального порога
        const currentMinutes = Math.floor(currentTime / 60);
        const thresholds = config[sessionType];
        
        if (!newState.minReached && currentMinutes >= thresholds.min) {
          newState.minReached = true;
          const notification: ThresholdNotification = {
            type: 'min',
            sessionType,
            timeReached: thresholds.min,
            color: 'green'
          };
          
          // Отправляем уведомление с кулдауном
          const currentTime = Date.now();
          if (currentTime - lastNotificationTimeRef.current > notificationCooldownMs) {
            showNotification(notification);
            lastNotificationTimeRef.current = currentTime;
          }
        }
        
        if (!newState.maxReached && currentMinutes >= thresholds.max) {
          newState.maxReached = true;
          const notification: ThresholdNotification = {
            type: 'max',
            sessionType,
            timeReached: thresholds.max,
            color: 'red'
          };
          
          // Отправляем уведомление с кулдауном
          const currentTime = Date.now();
          if (currentTime - lastNotificationTimeRef.current > notificationCooldownMs) {
            showNotification(notification);
            lastNotificationTimeRef.current = currentTime;
          }
        }
      }

      setTimerState(newState);
      
      // Отправляем обновление в main process
      window.ipcRenderer.send(TIMER_THRESHOLD_UPDATE, newState);
    },
    [config, timerState.minReached, timerState.maxReached]
  );

  // Сброс состояния пороговых значений
  const resetThresholdState = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      minReached: false,
      maxReached: false,
    }));
    
    window.ipcRenderer.send(RESET_THRESHOLD_STATE);
    lastNotificationTimeRef.current = 0;
  }, []);

  // Показ уведомления
  const showNotification = useCallback((notification: ThresholdNotification) => {
    const title = notification.type === 'min' 
      ? 'Минимум достигнут!' 
      : 'Максимум достигнут!';
    
    const message = createThresholdNotificationText(notification);
    
    // Отправляем уведомление в main process
    window.ipcRenderer.send(THRESHOLD_NOTIFICATION, {
      title,
      body: message,
      color: notification.color,
      type: notification.type
    });
    
    // Показываем browser notification если разрешено
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: notification.color === 'green' ? '/icons/success.png' : '/icons/warning.png',
        tag: `threshold-${notification.type}-${notification.sessionType}`
      });
    }
  }, []);

  // Подписываемся на сообщения от main process
  useEffect(() => {
    const handleThresholdUpdate = (event: any, newState: TimerState) => {
      setTimerState(newState);
    };

    window.ipcRenderer.on(TIMER_THRESHOLD_UPDATE, handleThresholdUpdate);

    return () => {
      window.ipcRenderer.removeListener(TIMER_THRESHOLD_UPDATE, handleThresholdUpdate);
    };
  }, []);

  // Автоматический сброс при смене типа сессии
  useEffect(() => {
    resetThresholdState();
  }, [timerState.sessionType]);

  return {
    config,
    timerState,
    updateConfig,
    updateTimerState,
    resetThresholdState,
    showNotification,
  };
};

export default useThresholdTimer;