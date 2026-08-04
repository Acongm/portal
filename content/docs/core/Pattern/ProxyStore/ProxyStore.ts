// ProxyStore.ts - 代理模式状态容器核心类

export type ProxyStoreSubscriber<T = any> = (
  value: T,
  key: string,
  prevValue: T
) => void

/**
 * 代理模式状态容器
 * 使用 Proxy 实现透明的响应式状态管理
 */
export class ProxyStore<T extends object = Record<string, any>> {
  private target: T
  private subscribers = new Map<string | symbol, Set<ProxyStoreSubscriber>>()
  private globalSubscribers = new Set<ProxyStoreSubscriber>()
  public proxy: T

  constructor(initialState: T = {} as T) {
    this.target = { ...initialState }
    this.proxy = this.createProxy()
  }

  private createProxy(): T {
    return new Proxy(this.target, {
      get: (target, key) => {
        return Reflect.get(target, key)
      },
      set: (target, key, value) => {
        const prevValue = Reflect.get(target, key)
        const result = Reflect.set(target, key, value)

        if (prevValue !== value) {
          this.notify(key as string, value, prevValue)
        }

        return result
      },
      deleteProperty: (target, key) => {
        const prevValue = Reflect.get(target, key)
        const result = Reflect.deleteProperty(target, key)

        this.notify(key as string, undefined, prevValue)

        return result
      }
    })
  }

  private notify(key: string, value: any, prevValue: any): void {
    // 通知特定 key 的订阅者
    this.subscribers.get(key)?.forEach((fn) => fn(value, key, prevValue))
    // 通知全局订阅者
    this.globalSubscribers.forEach((fn) => fn(value, key, prevValue))
  }

  /**
   * 订阅特定 key 的变化
   */
  subscribe(key: string, subscriber: ProxyStoreSubscriber): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(subscriber)

    // 如果已有值，立即触发
    if (key in this.target) {
      subscriber((this.target as any)[key], key, undefined)
    }

    return () => this.unsubscribe(key, subscriber)
  }

  /**
   * 取消订阅
   */
  unsubscribe(key: string, subscriber: ProxyStoreSubscriber): void {
    this.subscribers.get(key)?.delete(subscriber)
  }

  /**
   * 订阅所有变化
   */
  subscribeAll(subscriber: ProxyStoreSubscriber): () => void {
    this.globalSubscribers.add(subscriber)
    return () => this.globalSubscribers.delete(subscriber)
  }

  /**
   * 获取当前状态快照
   */
  getSnapshot(): T {
    return { ...this.target }
  }

  /**
   * 批量更新（合并触发）
   */
  batch(updates: Partial<T>): void {
    Object.assign(this.proxy, updates)
  }

  /**
   * 重置状态
   */
  reset(newState: T = {} as T): void {
    // 删除所有现有 key
    Object.keys(this.target).forEach((key) => {
      delete (this.proxy as any)[key]
    })
    // 设置新状态
    Object.assign(this.proxy, newState)
  }
}

/**
 * 创建类型安全的 ProxyStore
 */
export function createProxyStore<T extends object>(
  initialState?: T
): ProxyStore<T> {
  return new ProxyStore<T>(initialState)
}
