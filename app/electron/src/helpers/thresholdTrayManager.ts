import { Tray, nativeImage, NativeImage } from 'electron';
import { calculateThresholdProgress, getProgressColor } from '@pomatez/shareables';
import type { ThresholdConfig, TimerState } from '@pomatez/shareables';

export class ThresholdTrayManager {
  private tray: Tray | null = null;
  private baseIconPath: string;
  private thresholdConfig: ThresholdConfig | null = null;
  private currentTimerState: TimerState | null = null;

  constructor(baseIconPath: string) {
    this.baseIconPath = baseIconPath;
  }

  setTray(tray: Tray) {
    this.tray = tray;
  }

  updateThresholdConfig(config: ThresholdConfig | null) {
    this.thresholdConfig = config;
    this.updateTrayIcon();
  }

  updateTimerState(state: TimerState) {
    this.currentTimerState = state;
    this.updateTrayIcon();
  }

  private updateTrayIcon() {
    if (!this.tray || !this.thresholdConfig || !this.currentTimerState) {
      return;
    }

    // Создаем иконку с цветовым индикатором порога
    const icon = this.createThresholdIcon();
    if (icon) {
      this.tray.setImage(icon);
      this.tray.setToolTip(this.getTooltipText());
    }
  }

  private createThresholdIcon(): NativeImage | null {
    if (!this.thresholdConfig || !this.currentTimerState) {
      return null;
    }

    const progress = calculateThresholdProgress(
      this.currentTimerState.currentTime,
      this.thresholdConfig,
      this.currentTimerState.sessionType
    );

    const color = this.getZoneColor(progress.zone);
    
    // Создаем простую иконку с цветовым индикатором
    const canvas = this.createCanvas(16, 16);
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Фоновый круг
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.arc(8, 8, 7, 0, 2 * Math.PI);
      ctx.fill();
      
      // Цветовой индикатор в зависимости от зоны
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(8, 8, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Белая точка в центре для читаемости
      if (this.currentTimerState.isRunning) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, 8, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Конвертируем canvas в NativeImage
      const dataURL = canvas.toDataURL();
      return nativeImage.createFromDataURL(dataURL);
    }

    return null;
  }

  private createCanvas(width: number, height: number): HTMLCanvasElement {
    // В Node.js используем canvas library, если доступно
    // Иначе создаем простую заглушку
    try {
      const { createCanvas } = require('canvas');
      return createCanvas(width, height);
    } catch (error) {
      // Fallback: используем обычную иконку без цветовых индикаторов
      console.warn('Canvas library not available, using fallback tray icons');
      return null as any;
    }
  }

  private getZoneColor(zone: 'before-min' | 'between' | 'after-max'): string {
    switch (zone) {
      case 'before-min':
        return '#fbbf24'; // желтый - еще не достигнут минимум
      case 'between':
        return '#10b981'; // зеленый - в оптимальной зоне
      case 'after-max':
        return '#ef4444'; // красный - превышен максимум
      default:
        return '#6b7280'; // серый по умолчанию
    }
  }

  private getTooltipText(): string {
    if (!this.thresholdConfig || !this.currentTimerState) {
      return 'Pomatez Extended';
    }

    const progress = calculateThresholdProgress(
      this.currentTimerState.currentTime,
      this.thresholdConfig,
      this.currentTimerState.sessionType
    );

    const currentMinutes = Math.floor(this.currentTimerState.currentTime / 60);
    const thresholds = this.thresholdConfig[this.currentTimerState.sessionType];
    
    const sessionNames = {
      focus: 'Фокус',
      shortBreak: 'Короткий перерыв',
      longBreak: 'Длинный перерыв'
    };

    const sessionName = sessionNames[this.currentTimerState.sessionType];
    
    let statusText = '';
    switch (progress.zone) {
      case 'before-min':
        statusText = `⏳ До минимума: ${thresholds.min - currentMinutes} мин`;
        break;
      case 'between':
        statusText = `✅ Минимум достигнут! До максимума: ${thresholds.max - currentMinutes} мин`;
        break;
      case 'after-max':
        statusText = `⚠️ Максимум превышен! Рекомендуется завершить`;
        break;
    }

    return `Pomatez Extended\n${sessionName} - ${Math.floor(currentMinutes)}:${String(this.currentTimerState.currentTime % 60).padStart(2, '0')}\n${statusText}`;
  }

  // Создание статических иконок для разных состояний (fallback)
  createStaticIcons() {
    return {
      default: nativeImage.createFromPath(this.baseIconPath),
      yellow: this.createColoredIcon('#fbbf24'),
      green: this.createColoredIcon('#10b981'), 
      red: this.createColoredIcon('#ef4444')
    };
  }

  private createColoredIcon(color: string): NativeImage {
    // Простая реализация для создания цветной иконки
    // В реальном приложении здесь должна быть генерация PNG с нужным цветом
    return nativeImage.createFromPath(this.baseIconPath);
  }

  // Обновление иконки без canvas (fallback метод)
  updateTrayIconFallback() {
    if (!this.tray || !this.thresholdConfig || !this.currentTimerState) {
      return;
    }

    const progress = calculateThresholdProgress(
      this.currentTimerState.currentTime,
      this.thresholdConfig,
      this.currentTimerState.sessionType
    );

    const icons = this.createStaticIcons();
    
    let iconToUse = icons.default;
    switch (progress.zone) {
      case 'before-min':
        iconToUse = icons.yellow;
        break;
      case 'between':
        iconToUse = icons.green;
        break;
      case 'after-max':
        iconToUse = icons.red;
        break;
    }

    this.tray.setImage(iconToUse);
    this.tray.setToolTip(this.getTooltipText());
  }

  reset() {
    if (this.tray) {
      this.tray.setImage(nativeImage.createFromPath(this.baseIconPath));
      this.tray.setToolTip('Pomatez Extended');
    }
  }
}