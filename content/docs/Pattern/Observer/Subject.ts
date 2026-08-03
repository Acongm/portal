// Subject.ts - 观察者模式核心类

export type Observer<T = any> = (data: T) => void

/**
 * 被观察者（主题）
 * 观察者模式：一对多依赖关系，当主题状态变化时通知所有观察者
 */
export class Subject<T = any> {
  private observers = new Set<Observer<T>>()
  private state: T | undefined

  /**
   * 添加观察者
   */
  attach(observer: Observer<T>): void {
    this.observers.add(observer)
    // 如果已有状态，立即通知新观察者
    if (this.state !== undefined) {
      observer(this.state)
    }
  }

  /**
   * 移除观察者
   */
  detach(observer: Observer<T>): void {
    this.observers.delete(observer)
  }

  /**
   * 通知所有观察者
   */
  notify(data: T): void {
    this.state = data
    this.observers.forEach((observer) => observer(data))
  }

  /**
   * 获取当前状态
   */
  getState(): T | undefined {
    return this.state
  }

  /**
   * 清除状态并通知观察者
   */
  clear(): void {
    this.state = undefined
    this.observers.forEach((observer) => observer(undefined as T))
  }

  /**
   * 获取观察者数量
   */
  get observerCount(): number {
    return this.observers.size
  }
}

/**
 * 多主题管理器
 * 管理多个命名的 Subject
 */
export class SubjectManager {
  private subjects = new Map<string, Subject<any>>()

  private ensureSubject<T>(key: string): Subject<T> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<T>())
    }
    return this.subjects.get(key)!
  }

  /**
   * 获取指定 key 的 Subject（高级/更原生的观察者用法）
   */
  subject<T>(key: string): Subject<T> {
    return this.ensureSubject<T>(key)
  }

  /**
   * 订阅指定主题
   */
  subscribe<T>(key: string, observer: Observer<T>): void {
    this.ensureSubject<T>(key).attach(observer)
  }

  /**
   * 取消订阅
   */
  unsubscribe<T>(key: string, observer: Observer<T>): void {
    this.ensureSubject<T>(key).detach(observer)
  }

  /**
   * 发布数据
   */
  publish<T>(key: string, data: T): void {
    this.ensureSubject<T>(key).notify(data)
  }

  /**
   * 获取当前数据
   */
  getData<T>(key: string): T | undefined {
    return this.ensureSubject<T>(key).getState()
  }

  /**
   * 清除数据
   */
  clearData(key: string): void {
    this.ensureSubject(key).clear()
  }
}
