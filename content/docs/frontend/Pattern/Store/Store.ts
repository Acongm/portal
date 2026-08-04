// Store.ts - 单例状态容器核心类

export type StoreSubscriber<T = any> = (
  data: T,
  prevData: T | undefined
) => void

/**
 * 单例状态容器
 * 简单的全局状态管理，支持订阅状态变化
 */
export class Store<T extends Record<string, any> = Record<string, any>> {
  private state: Partial<T> = {}
  private subscribers = new Map<keyof T, Set<StoreSubscriber>>()

  /**
   * 设置状态
   */
  setState<K extends keyof T>(key: K, value: T[K]): void {
    const prevValue = this.state[key]
    this.state[key] = value
    this.notifySubscribers(key, value, prevValue)
  }

  /**
   * 获取状态
   */
  getState<K extends keyof T>(key: K): T[K] | undefined {
    return this.state[key]
  }

  /**
   * 删除状态
   */
  deleteState<K extends keyof T>(key: K): void {
    const prevValue = this.state[key]
    delete this.state[key]
    this.notifySubscribers(key, undefined as any, prevValue)
  }

  /**
   * 订阅状态变化
   */
  subscribe<K extends keyof T>(
    key: K,
    subscriber: StoreSubscriber<T[K]>
  ): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(subscriber)

    // 如果已有状态，立即通知
    const currentValue = this.state[key]
    if (currentValue !== undefined) {
      subscriber(currentValue, undefined)
    }

    // 返回取消订阅函数
    return () => this.unsubscribe(key, subscriber)
  }

  /**
   * 取消订阅
   */
  unsubscribe<K extends keyof T>(
    key: K,
    subscriber: StoreSubscriber<T[K]>
  ): void {
    this.subscribers.get(key)?.delete(subscriber)
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers<K extends keyof T>(
    key: K,
    value: T[K],
    prevValue: T[K] | undefined
  ): void {
    this.subscribers
      .get(key)
      ?.forEach((subscriber) => subscriber(value, prevValue))
  }

  /**
   * 获取所有状态
   */
  getSnapshot(): Partial<T> {
    return { ...this.state }
  }

  /**
   * 重置所有状态
   */
  reset(): void {
    const keys = Object.keys(this.state) as (keyof T)[]
    keys.forEach((key) => this.deleteState(key))
  }

  /**
   * 批量更新状态
   */
  batchUpdate(updates: Partial<T>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.setState(key as keyof T, value as T[keyof T])
    })
  }
}

/**
 * 创建类型安全的 Store
 */
export function createStore<T extends Record<string, any>>(): Store<T> {
  return new Store<T>()
}
