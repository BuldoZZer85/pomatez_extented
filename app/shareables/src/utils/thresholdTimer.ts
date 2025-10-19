import { ThresholdConfig, ThresholdNotification, TimerState } from '../types/ThresholdTimer';

/**
 * Проверяет, достигнут ли минимальный или максимальный порог для текущей сессии
 */
export function checkThreshold(
  currentTimeSeconds: number,
  config: ThresholdConfig,
  sessionType: 'focus' | 'shortBreak' | 'longBreak',
  state: TimerState
): ThresholdNotification | null {
  const currentMinutes = Math.floor(currentTimeSeconds / 60);
  const thresholds = config[sessionType];

  // Проверяем минимальный порог (зеленое уведомление)
  if (!state.minReached && currentMinutes >= thresholds.min) {
    return {
      type: 'min',
      sessionType,
      timeReached: thresholds.min,
      color: 'green'
    };
  }

  // Проверяем максимальный порог (красное уведомление)
  if (!state.maxReached && currentMinutes >= thresholds.max) {
    return {
      type: 'max',
      sessionType,
      timeReached: thresholds.max,
      color: 'red'
    };
  }

  return null;
}

/**
 * Вычисляет прогресс между минимальным и максимальным порогом
 */
export function calculateThresholdProgress(
  currentTimeSeconds: number,
  config: ThresholdConfig,
  sessionType: 'focus' | 'shortBreak' | 'longBreak'
): {
  minProgress: number; // прогресс к минимуму (0-100%)
  maxProgress: number; // прогресс к максимуму (0-100%)
  zone: 'before-min' | 'between' | 'after-max';
} {
  const currentMinutes = currentTimeSeconds / 60;
  const thresholds = config[sessionType];

  const minProgress = Math.min(100, (currentMinutes / thresholds.min) * 100);
  const maxProgress = Math.min(100, (currentMinutes / thresholds.max) * 100);

  let zone: 'before-min' | 'between' | 'after-max';
  if (currentMinutes < thresholds.min) {
    zone = 'before-min';
  } else if (currentMinutes < thresholds.max) {
    zone = 'between';
  } else {
    zone = 'after-max';
  }

  return { minProgress, maxProgress, zone };
}

/**
 * Форматирует время в человекочитаемый вид
 */
export function formatThresholdTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 
    ? `${hours}ч ${remainingMinutes}мин`
    : `${hours}ч`;
}

/**
 * Получает цвет для индикатора прогресса в зависимости от зоны
 */
export function getProgressColor(zone: 'before-min' | 'between' | 'after-max'): string {
  switch (zone) {
    case 'before-min':
      return '#fbbf24'; // желтый - еще не достигнут минимум
    case 'between':
      return '#10b981'; // зеленый - между минимумом и максимумом
    case 'after-max':
      return '#ef4444'; // красный - превышен максимум
    default:
      return '#6b7280'; // серый по умолчанию
  }
}

/**
 * Создает текст уведомления для достижения порога
 */
export function createThresholdNotificationText(
  notification: ThresholdNotification
): string {
  const sessionNames = {
    focus: 'фокуса',
    shortBreak: 'короткого перерыва',
    longBreak: 'длинного перерыва'
  };

  const sessionName = sessionNames[notification.sessionType];
  const timeText = formatThresholdTime(notification.timeReached);

  if (notification.type === 'min') {
    return `✅ Достигнут минимум времени ${sessionName}: ${timeText}`;
  } else {
    return `⏰ Достигнут максимум времени ${sessionName}: ${timeText}. Рекомендуется завершить сессию.`;
  }
}

/**
 * Валидирует конфигурацию пороговых значений
 */
export function validateThresholdConfig(config: ThresholdConfig): string[] {
  const errors: string[] = [];

  // Проверяем, что минимум меньше максимума для каждого типа сессии
  if (config.focus.min >= config.focus.max) {
    errors.push('Минимальное время фокуса должно быть меньше максимального');
  }
  if (config.shortBreak.min >= config.shortBreak.max) {
    errors.push('Минимальное время короткого перерыва должно быть меньше максимального');
  }
  if (config.longBreak.min >= config.longBreak.max) {
    errors.push('Минимальное время длинного перерыва должно быть меньше максимального');
  }

  // Проверяем разумные пределы
  if (config.focus.min < 5 || config.focus.max > 120) {
    errors.push('Время фокуса должно быть от 5 до 120 минут');
  }
  if (config.shortBreak.min < 1 || config.shortBreak.max > 30) {
    errors.push('Время короткого перерыва должно быть от 1 до 30 минут');
  }
  if (config.longBreak.min < 5 || config.longBreak.max > 60) {
    errors.push('Время длинного перерыва должно быть от 5 до 60 минут');
  }

  return errors;
}