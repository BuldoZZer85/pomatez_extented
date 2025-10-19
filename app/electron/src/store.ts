import Store, { Options } from "electron-store";
import { nativeTheme } from "electron";
import { isWindow } from "./helpers";
import ElectronStore from "electron-store";
import type { ThresholdConfig } from "@pomatez/shareables";

type StoreProps = {
  userId?: string;
  isDarkMode?: boolean;
  useNativeTitlebar?: boolean;
  compactMode?: boolean;
  openAtLogin?: boolean;
  // Новое поле для хранения конфигурации порогов
  thresholdConfig?: ThresholdConfig | null;
};

/**
 * Was going to make SafeStore extend Store but it didn't seem to work how it should. (Class constructor ElectronStore cannot be invoked without 'new')
 *
 * This also ensures that we can force calling the store safely. Though I have switched the names to safeGet and safeSet to make it more clear.
 */
class SafeStore<
  T extends Record<string, any> = Record<string, unknown>
> {
  private store: ElectronStore<T>;
  constructor(props: Options<T>) {
    this.store = new Store<T>(props);
  }

  /**
   * Safely set a value in the store and catch errors
   * @param key
   * @param value
   */
  safeSet<Key extends keyof T>(key: Key, value?: T[Key]) {
    try {
      this.store.set(key as string, value as any);
    } catch (error) {
      console.error("[Store] Safe Set", error);
    }
  }

  /**
   * Safely get a value from the store and catch errors
   * @param key
   */
  safeGet<Key extends keyof T>(key: Key): T[Key] | undefined {
    try {
      return this.store.get(key as string) as T[Key];
    } catch (error) {
      console.error("[Store] Safe Get", error);
    }
    return undefined as any;
  }
}

// Wrap the store due to a delete issue
const store = new SafeStore<StoreProps>({
  defaults: {
    isDarkMode: nativeTheme.shouldUseDarkColors,
    useNativeTitlebar: !isWindow(),
    compactMode: false,
    openAtLogin: false,
    thresholdConfig: null,
  },
});

export default store;
