import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useThresholdTimer from '../hooks/useThresholdTimer';

// Компонент для интеграции threshold таймера с основным приложением
const ThresholdTimerIntegration: React.FC = () => {
  const {
    config,
    timerState,
    updateTimerState,
    resetThresholdState,
  } = useThresholdTimer();

  // Получаем состояние таймера из Redux store
  const timer = useSelector((state: any) => state.timer);
  const settings = useSelector((state: any) => state.settings);

  // Обновляем threshold состояние при изменении основного таймера
  useEffect(() => {
    if (!timer || !config) return;

    // Преобразуем тип сессии из основного таймера
    let sessionType: 'focus' | 'shortBreak' | 'longBreak';
    
    switch (timer.timerType) {
      case 'STAY_FOCUS':
        sessionType = 'focus';
        break;
      case 'SHORT_BREAK':
        sessionType = 'shortBreak';
        break;
      case 'LONG_BREAK':
        sessionType = 'longBreak';
        break;
      case 'SPECIAL_BREAK':
        sessionType = 'longBreak'; // Обрабатываем как длинный перерыв
        break;
      default:
        return; // Не обрабатываем неизвестные типы
    }

    // Преобразуем время в секунды (основное приложение хранит в миллисекундах)
    const currentTimeSeconds = Math.floor(timer.currentRound / 1000);

    // Обновляем threshold состояние
    updateTimerState(
      currentTimeSeconds,
      sessionType,
      timer.isPlaying
    );
  }, [
    timer?.currentRound,
    timer?.timerType,
    timer?.isPlaying,
    config,
    updateTimerState
  ]);

  // Сбрасываем состояние при смене сессии или сбросе таймера
  useEffect(() => {
    if (timer?.currentRound === 0 || timer?.round === 0) {
      resetThresholdState();
    }
  }, [timer?.currentRound, timer?.round, resetThresholdState]);

  // Этот компонент ничего не рендерит, он только обрабатывает логику
  return null;
};

export default ThresholdTimerIntegration;