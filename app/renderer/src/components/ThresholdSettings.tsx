import React, { useState, useEffect } from 'react';
import {
  ThresholdConfig,
  DEFAULT_THRESHOLD_CONFIG,
  validateThresholdConfig,
  formatThresholdTime,
} from '@pomatez/shareables';
import {
  SET_THRESHOLD_CONFIG,
  GET_THRESHOLD_CONFIG
} from '@pomatez/shareables';

interface ThresholdSettingsProps {
  onClose: () => void;
}

const ThresholdSettings: React.FC<ThresholdSettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState<ThresholdConfig>(DEFAULT_THRESHOLD_CONFIG);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загружаем текущую конфигурацию
    (window as any).ipcRenderer.invoke(GET_THRESHOLD_CONFIG).then((savedConfig: ThresholdConfig | null) => {
      if (savedConfig) {
        setConfig(savedConfig);
      }
      setIsLoading(false);
    });
  }, []);

  const handleInputChange = (
    sessionType: 'focus' | 'shortBreak' | 'longBreak',
    type: 'min' | 'max',
    value: number
  ) => {
    setConfig((prev: ThresholdConfig) => ({
      ...prev,
      [sessionType]: {
        ...prev[sessionType],
        [type]: value,
      },
    }));
  };

  const handleSave = () => {
    const validationErrors = validateThresholdConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    (window as any).ipcRenderer.send(SET_THRESHOLD_CONFIG, config);
    onClose();
  };

  const handleReset = () => {
    setConfig(DEFAULT_THRESHOLD_CONFIG);
    setErrors([]);
  };

  if (isLoading) {
    return (
      <div className="threshold-settings loading">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="threshold-settings">
      <div className="threshold-settings-header">
        <h2>Пороговые значения Помодоро</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="threshold-settings-content">
        <div className="settings-description">
          <p>
            Настройте минимальные и максимальные временные интервалы.
            <br />
            <span className="highlight">Зеленое уведомление</span> при достижении минимума,{' '}
            <span className="highlight-red">красное уведомление</span> при достижении максимума.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="error-messages">
            {errors.map((error, index) => (
              <div key={index} className="error-message">
                ⚠️ {error}
              </div>
            ))}
          </div>
        )}

        <div className="threshold-sections">
          {/* Фокус */}
          <div className="threshold-section">
            <h3>🎯 Фокус</h3>
            <div className="threshold-inputs">
              <div className="input-group">
                <label>Минимум:</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={config.focus.min}
                  onChange={(e) => handleInputChange('focus', 'min', parseInt(e.target.value) || 5)}
                />
                <span className="unit">мин</span>
              </div>
              <div className="input-group">
                <label>Максимум:</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={config.focus.max}
                  onChange={(e) => handleInputChange('focus', 'max', parseInt(e.target.value) || 50)}
                />
                <span className="unit">мин</span>
              </div>
            </div>
            <div className="range-display">
              Диапазон: {formatThresholdTime(config.focus.min)} - {formatThresholdTime(config.focus.max)}
            </div>
          </div>

          {/* Короткий перерыв */}
          <div className="threshold-section">
            <h3>☕ Короткий перерыв</h3>
            <div className="threshold-inputs">
              <div className="input-group">
                <label>Минимум:</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.shortBreak.min}
                  onChange={(e) => handleInputChange('shortBreak', 'min', parseInt(e.target.value) || 1)}
                />
                <span className="unit">мин</span>
              </div>
              <div className="input-group">
                <label>Максимум:</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.shortBreak.max}
                  onChange={(e) => handleInputChange('shortBreak', 'max', parseInt(e.target.value) || 15)}
                />
                <span className="unit">мин</span>
              </div>
            </div>
            <div className="range-display">
              Диапазон: {formatThresholdTime(config.shortBreak.min)} - {formatThresholdTime(config.shortBreak.max)}
            </div>
          </div>

          {/* Длинный перерыв */}
          <div className="threshold-section">
            <h3>🌍 Длинный перерыв</h3>
            <div className="threshold-inputs">
              <div className="input-group">
                <label>Минимум:</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.longBreak.min}
                  onChange={(e) => handleInputChange('longBreak', 'min', parseInt(e.target.value) || 5)}
                />
                <span className="unit">мин</span>
              </div>
              <div className="input-group">
                <label>Максимум:</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.longBreak.max}
                  onChange={(e) => handleInputChange('longBreak', 'max', parseInt(e.target.value) || 30)}
                />
                <span className="unit">мин</span>
              </div>
            </div>
            <div className="range-display">
              Диапазон: {formatThresholdTime(config.longBreak.min)} - {formatThresholdTime(config.longBreak.max)}
            </div>
          </div>
        </div>

        <div className="threshold-settings-actions">
          <button className="reset-button" onClick={handleReset}>
            Сбросить по умолчанию
          </button>
          <div className="action-buttons">
            <button className="cancel-button" onClick={onClose}>
              Отмена
            </button>
            <button className="save-button" onClick={handleSave}>
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThresholdSettings;