// StoreSingleton.ts - 单例状态容器导出

import { Store, StoreSubscriber } from './Store'

// 单例实例
const store = new Store<Record<string, any>>()

// ========== 类型导出 ==========
export type { StoreSubscriber }
export type SharedDataSubscriber<T = any> = StoreSubscriber<T>

// ========== 最推荐的调用方式（setState/getState/subscribe） ==========

export const setState = <T>(key: string, value: T): void => {
  store.setState(key, value)
}

export const getState = <T>(key: string): T | undefined => {
  return store.getState(key) as T | undefined
}

export const deleteState = (key: string): void => {
  store.deleteState(key)
}

export const subscribe = <T>(
  key: string,
  subscriber: StoreSubscriber<T>
): (() => void) => {
  return store.subscribe(key, subscriber as StoreSubscriber)
}

export const unsubscribe = <T>(
  key: string,
  subscriber: StoreSubscriber<T>
): void => {
  store.unsubscribe(key, subscriber as StoreSubscriber)
}

// ========== 共享数据（状态容器） ==========

/**
 * 发布共享数据
 */
export const publishSharedData = <T>(key: string, data: T): void => {
  setState(key, data)
}

/**
 * 获取共享数据
 */
export const getSharedData = <T>(key: string): T | undefined => {
  return getState<T>(key)
}

/**
 * 清除共享数据
 */
export const clearSharedData = (key: string): void => {
  deleteState(key)
}

/**
 * 订阅共享数据变化
 */
export const subscribeSharedData = <T>(
  key: string,
  callback: (data: T) => void
): void => {
  subscribe(key, callback as unknown as StoreSubscriber<T>)
}

/**
 * 取消订阅共享数据变化
 */
export const unsubscribeSharedData = <T>(
  key: string,
  callback: (data: T) => void
): void => {
  unsubscribe(key, callback as unknown as StoreSubscriber<T>)
}

// ========== 扩展 API ==========

/**
 * 获取所有状态快照
 */
export const getSnapshot = (): Record<string, any> => {
  return store.getSnapshot()
}

/**
 * 批量更新状态
 */
export const batchUpdate = (updates: Record<string, any>): void => {
  store.batchUpdate(updates)
}

/**
 * 重置所有状态
 */
export const resetStore = (): void => {
  store.reset()
}

// 导出实例（供高级用法）
export { Store, store }
