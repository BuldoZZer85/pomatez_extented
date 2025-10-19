import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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

const StyledThresholdSection = styled.div`
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-primary);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ThresholdGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const ThresholdCard = styled.div`
  background: var(--bg-primary);
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid var(--border-secondary);
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-primary);
  }
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  
  label {
    min-width: 70px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-secondary);
  }
  
  input {
    width: 70px;
    padding: 0.5rem;
    border: 1px solid var(--border-primary);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--color-primary);
    font-size: 0.875rem;
    text-align: center;
    
    &:focus {
      outline: none;
      border-color: var(--accent-primary);
    }
  }
  
  .unit {
    font-size: 0.875rem;
    color: var(--color-tertiary);
    font-weight: 500;
  }
`;

const RangeDisplay = styled.div`
  font-size: 0.75rem;
  color: var(--color-tertiary);
  text-align: center;
  font-style: italic;
  background: var(--bg-tertiary);
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  border: 1px solid #feb2b2;
  color: #742a2a;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EnableToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-secondary);
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
`;

const ThresholdSection: React.FC = () => {
  const [config, setConfig] = useState<ThresholdConfig>(DEFAULT_THRESHOLD_CONFIG);
  const [errors, setErrors] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await (window as any).ipcRenderer.invoke(GET_THRESHOLD_CONFIG);
        if (savedConfig) {
          setConfig(savedConfig);
          setIsEnabled(true);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки конфигурации пороговых значений:', error);
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleInputChange = (
    sessionType: 'focus' | 'shortBreak' | 'longBreak',
    type: 'min' | 'max',
    value: number
  ) => {
    const newConfig: ThresholdConfig = {
      ...config,
      [sessionType]: {
        ...config[sessionType],
        [type]: value,
      },
    };

    setConfig(newConfig);
    
    // Валидация и сохранение
    const validationErrors = validateThresholdConfig(newConfig);
    setErrors(validationErrors);
    
    if (validationErrors.length === 0 && isEnabled) {
      (window as any).ipcRenderer.send(SET_THRESHOLD_CONFIG, newConfig);
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    
    if (enabled) {
      // Валидируем перед включением
      const validationErrors = validateThresholdConfig(config);
      if (validationErrors.length === 0) {
        (window as any).ipcRenderer.send(SET_THRESHOLD_CONFIG, config);
      } else {
        setErrors(validationErrors);
      }
    } else {
      // Отключаем пороговые значения
      (window as any).ipcRenderer.send(SET_THRESHOLD_CONFIG, null);
      setErrors([]);
    }
  };

  if (isLoading) {
    return (
      <StyledThresholdSection>
        <div style={{ textAlign: 'center', color: 'var(--color-secondary)' }}>
          Загрузка настроек пороговых значений...
        </div>
      </StyledThresholdSection>
    );
  }

  return (
    <StyledThresholdSection>
      <SectionHeader>
        <h3>
          ⚡ Пороговые значения времени
        </h3>
        <EnableToggle>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
          />
          Включить пороговые уведомления
        </EnableToggle>
      </SectionHeader>

      {!isEnabled && (
        <div style={{ 
          textAlign: 'center', 
          color: 'var(--color-tertiary)', 
          fontStyle: 'italic',
          padding: '2rem'
        }}>
          Пороговые значения отключены. Включите чекбокс выше для настройки минимальных и максимальных времен сессий.
        </div>
      )}

      {isEnabled && (
        <>
          {errors.length > 0 && (
            <div>
              {errors.map((error, index) => (
                <ErrorMessage key={index}>
                  ⚠️ {error}
                </ErrorMessage>
              ))}
            </div>
          )}

          <div style={{ 
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'var(--bg-tertiary)',
            borderRadius: '4px',
            fontSize: '0.875rem',
            color: 'var(--color-secondary)',
            lineHeight: '1.4'
          }}>
            <strong>💡 Как это работает:</strong> Установите минимальное и максимальное время для каждого типа сессии.
            <br />
            • <span style={{color: '#10b981', fontWeight: 'bold'}}>Зеленое уведомление</span> при достижении минимума
            • <span style={{color: '#ef4444', fontWeight: 'bold'}}>Красное уведомление</span> при достижении максимума
          </div>

          <ThresholdGrid>
            {/* Focus Card */}
            <ThresholdCard>
              <CardHeader>
                <span>🎯</span>
                <h4>Фокус</h4>
              </CardHeader>
              <InputGroup>
                <label>Минимум:</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={config.focus.min}
                  onChange={(e) => handleInputChange('focus', 'min', parseInt(e.target.value) || 5)}
                  disabled={!isEnabled}
                />
                <span className="unit">мин</span>
              </InputGroup>
              <InputGroup>
                <label>Максимум:</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={config.focus.max}
                  onChange={(e) => handleInputChange('focus', 'max', parseInt(e.target.value) || 50)}
                  disabled={!isEnabled}
                />
                <span className="unit">мин</span>
              </InputGroup>
              <RangeDisplay>
                Диапазон: {formatThresholdTime(config.focus.min)} - {formatThresholdTime(config.focus.max)}
              </RangeDisplay>
            </ThresholdCard>

            {/* Short Break Card */}
            <ThresholdCard>
              <CardHeader>
                <span>☕</span>
                <h4>Короткий перерыв</h4>
              </CardHeader>
              <InputGroup>
                <label>Минимум:</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.shortBreak.min}
                  onChange={(e) => handleInputChange('shortBreak', 'min', parseInt(e.target.value) || 1)}
                  disabled={!isEnabled}
                />
                <span className="unit">мин</span>
              </InputGroup>
              <InputGroup>
                <label>Максимум:</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.shortBreak.max}
                  onChange={(e) => handleInputChange('shortBreak', 'max', parseInt(e.target.value) || 15)}
                  disabled={!isEnabled}
                />
                <span className="unit">мин</span>
              </InputGroup>
              <RangeDisplay>
                Диапазон: {formatThresholdTime(config.shortBreak.min)} - {formatThresholdTime(config.shortBreak.max)}
              </RangeDisplay>
            </ThresholdCard>

            {/* Long Break Card */}
            <ThresholdCard>
              <CardHeader>
                <span>🌍</span>
                <h4>Длинный перерыв</h4>
              </CardHeader>
              <InputGroup>
                <label>Минимум:</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.longBreak.min}
                  onChange={(e) => handleInputChange('longBreak', 'min', parseInt(e.target.value) || 5)}
                  disabled={!isEnabled}
                />
                <span className="unit">мин</span>
              </InputGroup>
              <InputGroup>
                <label>Максимум:</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.longBreak.max}
                  onChange={(e) => handleInputChange('longBreak', 'max', parseInt(e.target.value) || 30)}
                  disabled={!isEnabled}
                />
                <span className="unit">мин</span>
              </InputGroup>
              <RangeDisplay>
                Диапазон: {formatThresholdTime(config.longBreak.min)} - {formatThresholdTime(config.longBreak.max)}
              </RangeDisplay>
            </ThresholdCard>
          </ThresholdGrid>
        </>
      )}
    </StyledThresholdSection>
  );
};

export default ThresholdSection;