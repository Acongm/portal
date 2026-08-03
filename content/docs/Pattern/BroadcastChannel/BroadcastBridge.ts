// BroadcastBridge.ts - 广播通道核心类

export type BroadcastHandler<T = any> = (data: T) => void

/**
 * 广播通道桥接器
 * 支持跨浏览器标签页、跨 iframe 的数据同步
 */
export class BroadcastBridge {
  private channel: BroadcastChannel
  private handlers = new Map<string, Set<BroadcastHandler>>()
  private localCache = new Map<string, any>()

  constructor(channelName: string = 'shared-data-channel') {
    this.channel = new BroadcastChannel(channelName)
    this.channel.onmessage = this.handleMessage.bind(this)
  }

  private handleMessage(event: MessageEvent): void {
    const { type, key, data } = event.data

    if (type === 'publish') {
      this.localCache.set(key, data)
      this.handlers.get(key)?.forEach((handler) => handler(data))
    } else if (type === 'clear') {
      this.localCache.delete(key)
      this.handlers.get(key)?.forEach((handler) => handler(null))
    } else if (type === 'sync-request') {
      // 其他标签页请求同步数据
      if (this.localCache.has(key)) {
        this.channel.postMessage({
          type: 'sync-response',
          key,
          data: this.localCache.get(key)
        })
      }
    } else if (type === 'sync-response') {
      // 收到同步响应
      if (!this.localCache.has(key)) {
        this.localCache.set(key, data)
        this.handlers.get(key)?.forEach((handler) => handler(data))
      }
    }
  }

  /**
   * 发布数据（会同步到其他标签页）
   */
  publish<T>(key: string, data: T): void {
    this.localCache.set(key, data)
    // 通知本地订阅者
    this.handlers.get(key)?.forEach((handler) => handler(data))
    // 广播到其他标签页
    this.channel.postMessage({ type: 'publish', key, data })
  }

  /**
   * 获取数据
   */
  get<T>(key: string): T | undefined {
    return this.localCache.get(key)
  }

  /**
   * 清除数据
   */
  clear(key: string): void {
    this.localCache.delete(key)
    this.handlers.get(key)?.forEach((handler) => handler(null))
    this.channel.postMessage({ type: 'clear', key })
  }

  /**
   * 订阅数据变化
   */
  subscribe<T>(key: string, handler: BroadcastHandler<T>): void {
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set())
    }
    this.handlers.get(key)!.add(handler)

    // 如果本地有数据，立即通知
    if (this.localCache.has(key)) {
      handler(this.localCache.get(key))
    } else {
      // 向其他标签页请求同步数据
      this.channel.postMessage({ type: 'sync-request', key })
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe<T>(key: string, handler: BroadcastHandler<T>): void {
    this.handlers.get(key)?.delete(handler)
  }

  /**
   * 关闭通道
   */
  close(): void {
    this.channel.close()
    this.handlers.clear()
    this.localCache.clear()
  }
}
