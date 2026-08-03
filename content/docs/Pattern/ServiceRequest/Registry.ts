// Registry.ts

/**
 * 通用键值注册表（缓存 / 注册中心）
 */
export class Registry<T> {
  protected store = new Map<string, T>()

  set(key: string, value: T): void {
    this.store.set(key, value)
  }

  get(key: string): T | undefined {
    return this.store.get(key)
  }

  has(key: string): boolean {
    return this.store.has(key)
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  keys(): IterableIterator<string> {
    return this.store.keys()
  }

  values(): IterableIterator<T> {
    return this.store.values()
  }

  entries(): IterableIterator<[string, T]> {
    return this.store.entries()
  }

  size(): number {
    return this.store.size
  }

  /**
   * 调用存储的回调函数（仅当 T 为函数类型时有效）
   */
  invoke(key: string, ...args: any[]): void {
    const fn = this.store.get(key)
    if (typeof fn === 'function') {
      fn(...args)
    }
  }
}
