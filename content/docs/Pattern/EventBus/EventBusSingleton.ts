// EventBusSingleton.ts - 事件总线单例导出

import { EventBus, EventHandler } from './EventBus'

// 单例实例
const bus = new EventBus()

// ========== 类型导出 ==========
export type { EventHandler }
export type SharedDataSubscriber<T = any> = EventHandler<T>

// ========== 最推荐的调用方式（on/off/emit） ==========

export const on = <T>(
  event: string,
  handler: EventHandler<T>,
  immediate = true
): void => {
  bus.on(event, handler, immediate)
}

export const off = <T>(event: string, handler: EventHandler<T>): void => {
  bus.off(event, handler)
}

export const emit = <T>(event: string, data: T, cache = true): void => {
  bus.emit(event, data, cache)
}

export const once = <T>(event: string, handler: EventHandler<T>): void => {
  bus.once(event, handler)
}

export const get = <T>(event: string): T | undefined => {
  return bus.get<T>(event)
}

export const clear = (event: string): void => {
  bus.clear(event)
}

export const destroy = (): void => {
  bus.destroy()
}

export const listenerCount = (event: string): number => {
  return bus.listenerCount(event)
}

// ========== 共享数据（事件总线） ==========

/**
 * 发布共享数据
 */
export const publishSharedData = <T>(key: string, data: T): void => {
  emit(key, data)
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

// ========== 事件总线扩展 API ==========

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
export { EventBus, bus }
