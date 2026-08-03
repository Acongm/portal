// SharedStateBridge.ts

export type SharedDataSubscriber<T = any> = (data: T) => void

export class SharedStateBridge {
  // === 状态共享（Pub/Sub） ===
  protected sharedDataRegistry = new Map<string, any>()
  protected sharedDataSubscribers = new Map<string, Set<SharedDataSubscriber>>()

  // ========== 状态共享（发布订阅） ==========

  publishSharedData<T>(key: string, data: T): void {
    this.sharedDataRegistry.set(key, data)
    const subs = this.sharedDataSubscribers.get(key)
    subs?.forEach((cb) => cb(data))
  }

  getSharedData<T>(key: string): T | undefined {
    return this.sharedDataRegistry.get(key)
  }

  clearSharedData(key: string): void {
    this.sharedDataRegistry.delete(key)
    const subs = this.sharedDataSubscribers.get(key)
    subs?.forEach((cb) => cb(null))
  }

  subscribeSharedData<T>(key: string, callback: SharedDataSubscriber<T>): void {
    if (!this.sharedDataSubscribers.has(key)) {
      this.sharedDataSubscribers.set(key, new Set())
    }
    this.sharedDataSubscribers.get(key)!.add(callback as SharedDataSubscriber)
    const existing = this.sharedDataRegistry.get(key)
    if (existing !== undefined) callback(existing)
  }

  unsubscribeSharedData(key: string, callback: SharedDataSubscriber): void {
    this.sharedDataSubscribers.get(key)?.delete(callback)
  }
}
