// EventBus.ts - 事件总线核心类

export type EventHandler<T = any> = (data: T) => void

/**
 * 事件总线
 * 实现组件间的事件驱动通信
 */
export class EventBus {
  private events = new Map<string, Set<EventHandler>>()
  private stateCache = new Map<string, any>()

  /**
   * 订阅事件
   * @param event 事件名
   * @param handler 处理函数
   * @param immediate 是否立即触发（如果有缓存数据）
   */
  on<T>(event: string, handler: EventHandler<T>, immediate = true): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)

    // 如果有缓存数据且需要立即触发
    if (immediate && this.stateCache.has(event)) {
      handler(this.stateCache.get(event))
    }
  }

  /**
   * 取消订阅
   */
  off<T>(event: string, handler: EventHandler<T>): void {
    this.events.get(event)?.delete(handler)
  }

  /**
   * 发送事件
   * @param event 事件名
   * @param data 数据
   * @param cache 是否缓存数据（默认 true）
   */
  emit<T>(event: string, data: T, cache = true): void {
    if (cache) {
      this.stateCache.set(event, data)
    }
    this.events.get(event)?.forEach((handler) => handler(data))
  }

  /**
   * 获取缓存的数据
   */
  get<T>(event: string): T | undefined {
    return this.stateCache.get(event)
  }

  /**
   * 清除事件数据
   */
  clear(event: string): void {
    this.stateCache.delete(event)
    this.events.get(event)?.forEach((handler) => handler(null))
  }

  /**
   * 一次性订阅（触发后自动取消）
   */
  once<T>(event: string, handler: EventHandler<T>): void {
    const wrapper: EventHandler<T> = (data) => {
      handler(data)
      this.off(event, wrapper)
    }
    this.on(event, wrapper, false)
  }

  /**
   * 清除所有事件监听
   */
  destroy(): void {
    this.events.clear()
    this.stateCache.clear()
  }

  /**
   * 获取事件监听者数量
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0
  }
}
