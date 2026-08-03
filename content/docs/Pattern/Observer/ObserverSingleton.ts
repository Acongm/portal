// ObserverSingleton.ts - 观察者模式单例导出

import { Observer, Subject, SubjectManager } from './Subject'

// 单例实例
const manager = new SubjectManager()

// ========== 类型导出 ==========
export type { Observer }
export type SharedDataSubscriber<T = any> = Observer<T>

// ========== 最推荐的调用方式（Subject/Observer 风格） ==========

/**
 * 获取指定 key 的 Subject
 */
export const subject = <T>(key: string): Subject<T> => {
  return manager.subject<T>(key)
}

// ========== 共享数据（观察者模式） ==========

/**
 * 发布共享数据
 */
export const publishSharedData = <T>(key: string, data: T): void => {
  manager.publish(key, data)
}

/**
 * 获取共享数据
 */
export const getSharedData = <T>(key: string): T | undefined => {
  return manager.getData<T>(key)
}

/**
 * 清除共享数据
 */
export const clearSharedData = (key: string): void => {
  manager.clearData(key)
}

/**
 * 订阅共享数据变化
 */
export const subscribeSharedData = <T>(
  key: string,
  callback: SharedDataSubscriber<T>
): void => {
  manager.subscribe(key, callback)
}

/**
 * 取消订阅共享数据变化
 */
export const unsubscribeSharedData = <T>(
  key: string,
  callback: SharedDataSubscriber<T>
): void => {
  manager.unsubscribe(key, callback)
}

// 导出管理器（供高级用法）
export { SubjectManager, manager }
