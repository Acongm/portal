// CustomEventBridge.ts - 原生 DOM 自定义事件核心类

export type CustomEventHandler<T = any> = (data: T) => void

/**
 * 自定义事件桥接器
 * 基于原生 DOM CustomEvent 实现跨组件通信
 */
export class CustomEventBridge {
  private target: EventTarget
  private prefix: string
  private cache = new Map<string, any>()
  private wrapperMap = new WeakMap<CustomEventHandler, EventListener>()

  constructor(target: EventTarget = window, prefix: string = 'shared:') {
    this.target = target
    this.prefix = prefix
  }

  private getEventName(key: string): string {
    return `${this.prefix}${key}`
  }

  /**
   * 发布数据
   */
  publish<T>(key: string, data: T): void {
    this.cache.set(key, data)
    const event = new CustomEvent(this.getEventName(key), {
      detail: data,
      bubbles: false,
      cancelable: false
    })
    this.target.dispatchEvent(event)
  }

  /**
   * 获取数据
   */
  get<T>(key: string): T | undefined {
    return this.cache.get(key)
  }

  /**
   * 清除数据
   */
  clear(key: string): void {
    this.cache.delete(key)
    const event = new CustomEvent(this.getEventName(key), {
      detail: null,
      bubbles: false,
      cancelable: false
    })
    this.target.dispatchEvent(event)
  }

  /**
   * 订阅数据变化
   */
  subscribe<T>(key: string, handler: CustomEventHandler<T>): void {
    const wrapper: EventListener = (e: Event) => {
      handler((e as CustomEvent).detail)
    }
    this.wrapperMap.set(handler, wrapper)
    this.target.addEventListener(this.getEventName(key), wrapper)

    // 如果已有数据，立即触发
    if (this.cache.has(key)) {
      handler(this.cache.get(key))
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe<T>(key: string, handler: CustomEventHandler<T>): void {
    const wrapper = this.wrapperMap.get(handler)
    if (wrapper) {
      this.target.removeEventListener(this.getEventName(key), wrapper)
      this.wrapperMap.delete(handler)
    }
  }

  /**
   * 一次性订阅
   */
  once<T>(key: string, handler: CustomEventHandler<T>): void {
    const wrapper: EventListener = (e: Event) => {
      handler((e as CustomEvent).detail)
      this.target.removeEventListener(this.getEventName(key), wrapper)
    }
    this.target.addEventListener(this.getEventName(key), wrapper)
  }
}
