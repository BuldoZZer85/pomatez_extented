import React, { useMemo } from 'react';
import {
  ThresholdConfig,
  TimerState,
  calculateThresholdProgress,
  getProgressColor,
  formatThresholdTime,
} from 'shareables';

interface ThresholdProgressIndicatorProps {
  currentTime: number; // в секундах
  sessionType: 'focus' | 'shortBreak' | 'longBreak';
  config: ThresholdConfig;
  timerState: TimerState;
}

const ThresholdProgressIndicator: React.FC<ThresholdProgressIndicatorProps> = ({
  currentTime,
  sessionType,
  config,
  timerState,
}) => {
  const progressInfo = useMemo(() => {
    return calculateThresholdProgress(currentTime, config, sessionType);
  }, [currentTime, config, sessionType]);

  const thresholds = config[sessionType];
  const currentMinutes = Math.floor(currentTime / 60);
  const currentSeconds = currentTime % 60;
  const progressColor = getProgressColor(progressInfo.zone);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusText = (): string => {
    switch (progressInfo.zone) {
      case 'before-min':
        return `До минимума: ${formatThresholdTime(thresholds.min - currentMinutes)}`;
      case 'between':
        return `Минимум достигнут! До максимума: ${formatThresholdTime(thresholds.max - currentMinutes)}`;
      case 'after-max':
        return 'Максимум превышен! Рекомендуется завершить.';
      default:
        return '';
    }
  };

  const getStatusIcon = (): string => {
    switch (progressInfo.zone) {
      case 'before-min':
        return '🔄'; // поворот
      case 'between':
        return '✅'; // зеленая галочка
      case 'after-max':
        return '⚠️'; // предупреждение
      default:
        return '⏱️';
    }
  };

  return (
    <div className="threshold-progress-indicator">
      {/* Основное время */}
      <div className="main-timer-display">
        <div className="timer-time" style={{ color: progressColor }}>
          {formatTime(currentTime)}
        </div>
        <div className="timer-status">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>

      {/* Прогресс-бар с порогами */}
      <div className="threshold-progress-bar">
        <div className="progress-track">
          {/* Минимальная отметка */}
          <div 
            className="threshold-marker threshold-min"
            style={{
              left: `${(thresholds.min / thresholds.max) * 100}%`,
            }}
          >
            <div className="marker-line marker-line-min"></div>
            <div className="marker-label">{formatThresholdTime(thresholds.min)}</div>
          </div>

          {/* Максимальная отметка */}
          <div 
            className="threshold-marker threshold-max"
            style={{
              left: '100%',
            }}
          >
            <div className="marker-line marker-line-max"></div>
            <div className="marker-label">{formatThresholdTime(thresholds.max)}</div>
          </div>

          {/* Прогресс бар */}
          <div 
            className="progress-fill"
            style={{
              width: `${Math.min(100, progressInfo.maxProgress)}%`,
              backgroundColor: progressColor,
            }}
          >
            {/* Маркер текущего положения */}
            <div className="current-position-marker"></div>
          </div>
        </div>
      </div>

      {/* Информация о порогах */}
      <div className="threshold-info">
        <div className="threshold-info-item">
          <span className="info-label">Минимум:</span>
          <span className={`info-value ${timerState.minReached ? 'reached' : 'not-reached'}`}>
            {formatThresholdTime(thresholds.min)}
            {timerState.minReached && ' ✅'}
          </span>
        </div>
        <div className="threshold-info-item">
          <span className="info-label">Максимум:</span>
          <span className={`info-value ${timerState.maxReached ? 'reached' : 'not-reached'}`}>
            {formatThresholdTime(thresholds.max)}
            {timerState.maxReached && ' ⚠️'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ThresholdProgressIndicator;