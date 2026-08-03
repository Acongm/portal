// BroadcastSingleton.ts - 广播通道单例导出

import { BroadcastBridge, BroadcastHandler } from './BroadcastBridge'

// 单例实例
const bridge = new BroadcastBridge('app-shared-channel')

// ========== 类型导出 ==========
export type { BroadcastHandler }
export type SharedDataSubscriber<T = any> = BroadcastHandler<T>

// ========== 最推荐的调用方式（publish/subscribe） ==========

export const publish = <T>(key: string, data: T): void => {
  bridge.publish(key, data)
}

export const get = <T>(key: string): T | undefined => {
  return bridge.get<T>(key)
}

export const clear = (key: string): void => {
  bridge.clear(key)
}

export const subscribe = <T>(
  key: string,
  handler: BroadcastHandler<T>
): void => {
  bridge.subscribe(key, handler)
}

export const unsubscribe = <T>(
  key: string,
  handler: BroadcastHandler<T>
): void => {
  bridge.unsubscribe(key, handler)
}

export const close = (): void => {
  bridge.close()
}

// ========== 共享数据（广播通道） ==========

/**
 * 发布共享数据（同步到其他标签页）
 */
export const publishSharedData = <T>(key: string, data: T): void => {
  publish(key, data)
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
  subscribe(key, callback)
}

/**
 * 取消订阅共享数据变化
 */
export const unsubscribeSharedData = <T>(
  key: string,
  callback: SharedDataSubscriber<T>
): void => {
  unsubscribe(key, callback)
}

// 导出实例（供高级用法）
export { BroadcastBridge, bridge }

// 页面卸载时关闭通道
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    close()
  })
}
