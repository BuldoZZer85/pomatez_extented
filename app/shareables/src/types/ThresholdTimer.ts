export interface ThresholdConfig {
  focus: {
    min: number; // минимальное время фокуса в минутах
    max: number; // максимальное время фокуса в минутах
  };
  shortBreak: {
    min: number; // минимальное время короткого перерыва
    max: number; // максимальное время короткого перерыва
  };
  longBreak: {
    min: number; // минимальное время длинного перерыва
    max: number; // максимальное время длинного перерыва
  };
}

export interface ThresholdNotification {
  type: 'min' | 'max';
  sessionType: 'focus' | 'shortBreak' | 'longBreak';
  timeReached: number; // время в минутах
  color: 'green' | 'red';
}

export interface TimerState {
  currentTime: number; // текущее время в секундах
  sessionType: 'focus' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  minReached: boolean; // достигнут минимум
  maxReached: boolean; // достигнут максимум
}

export const DEFAULT_THRESHOLD_CONFIG: ThresholdConfig = {
  focus: {
    min: 25, // 25 минут минимум
    max: 50, // 50 минут максимум
  },
  shortBreak: {
    min: 5, // 5 минут минимум
    max: 15, // 15 минут максимум
  },
  longBreak: {
    min: 15, // 15 минут минимум
    max: 30, // 30 минут максимум
  },
};