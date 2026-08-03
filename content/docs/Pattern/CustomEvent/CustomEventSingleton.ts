// CustomEventSingleton.ts - 自定义事件单例导出

import { CustomEventBridge, CustomEventHandler } from './CustomEventBridge'

// 单例实例（挂载在 window 上）
const bridge =
  typeof window !== 'undefined'
    ? new CustomEventBridge(window, 'shared:')
    : new CustomEventBridge(new EventTarget(), 'shared:')

// ========== 类型导出 ==========
export type { CustomEventHandler }
export type SharedDataSubscriber<T = any> = CustomEventHandler<T>

// ========== 最推荐的调用方式（DOM 事件风格） ==========

export const on = <T>(key: string, handler: CustomEventHandler<T>): void => {
  bridge.subscribe(key, handler)
}

export const off = <T>(key: string, handler: CustomEventHandler<T>): void => {
  bridge.unsubscribe(key, handler)
}

export const dispatch = <T>(key: string, detail: T): void => {
  bridge.publish(key, detail)
}

export const once = <T>(key: string, handler: CustomEventHandler<T>): void => {
  bridge.once(key, handler)
}

export const get = <T>(key: string): T | undefined => {
  return bridge.get<T>(key)
}

export const clear = (key: string): void => {
  bridge.clear(key)
}

// ========== 共享数据（自定义事件） ==========

/**
 * 发布共享数据
 */
export const publishSharedData = <T>(key: string, data: T): void => {
  dispatch(key, data)
}

/**
 * 获取共享数据
 */
export const getSharedData = <T>(key: string): T | undefined => {
  return get<T>(key)
}

/**
 * 清除共享数据
 */
export const clearSharedData = (key: string): void => {
  clear(key)
}

/**
 * 订阅共享数据变化
 */
export const subscribeSharedData = <T>(
  key: string,
  callback: SharedDataSubscriber<T>
): void => {
  on(key, callback)
}

/**
 * 取消订阅共享数据变化
 */
export const unsubscribeSharedData = <T>(
  key: string,
  callback: SharedDataSubscriber<T>
): void => {
  off(key, callback)
}

/**
 * 一次性订阅
 */
export const onceSharedData = <T>(
  key: string,
  callback: SharedDataSubscriber<T>
): void => {
  once(key, callback)
}

// 导出实例（供高级用法）
export { CustomEventBridge, bridge }
