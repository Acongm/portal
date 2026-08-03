// ProxyStoreSingleton.ts - 代理模式单例导出

import { ProxyStore, ProxyStoreSubscriber } from './ProxyStore'

// 单例实例
const store = new ProxyStore<Record<string, any>>()

// legacy wrapper map: subscribeSharedData 会包装 callback，这里保存映射用于正确取消订阅
const legacyWrapperMap = new Map<
  string,
  WeakMap<Function, ProxyStoreSubscriber>
>()

// ========== Vue3 风格：最小可用的响应式内核（依赖收集/触发） ==========

type Dep = Set<ReactiveEffect>

type ReactiveEffect = {
  active: boolean
  deps: Dep[]
  run: () => any
  stop: () => void
}

let activeEffect: ReactiveEffect | null = null
const effectStack: ReactiveEffect[] = []

const targetMap = new WeakMap<object, Map<PropertyKey, Dep>>()

function cleanupEffect(effect: ReactiveEffect): void {
  for (const dep of effect.deps) {
    dep.delete(effect)
  }
  effect.deps.length = 0
}

function track(target: object, key: PropertyKey): void {
  if (!activeEffect || !activeEffect.active) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map<PropertyKey, Dep>()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set<ReactiveEffect>()
    depsMap.set(key, dep)
  }

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

function trigger(target: object, key: PropertyKey): void {
  const depsMap = targetMap.get(target)
  const dep = depsMap?.get(key)
  if (!dep || dep.size === 0) return

  // clone 避免迭代过程中集合被修改
  const effects = Array.from(dep)
  for (const eff of effects) {
    if (eff.active) eff.run()
  }
}

function effect(fn: () => any): () => any {
  const reactiveEffect: ReactiveEffect = {
    active: true,
    deps: [],
    run: () => {
      if (!reactiveEffect.active) return fn()
      cleanupEffect(reactiveEffect)
      try {
        activeEffect = reactiveEffect
        effectStack.push(reactiveEffect)
        return fn()
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1] ?? null
      }
    },
    stop: () => {
      if (!reactiveEffect.active) return
      reactiveEffect.active = false
      cleanupEffect(reactiveEffect)
    }
  }

  reactiveEffect.run()
  return () => reactiveEffect.stop()
}

/**
 * Vue3 风格：reactive
 *
 * 说明：这是一个“够用版”的 reactive，只做浅层 key 的依赖追踪。
 */
export function reactive<T extends object>(raw: T): T {
  return new Proxy(raw, {
    get(target, key, receiver) {
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const oldValue = (target as any)[key]
      const result = Reflect.set(target, key, value, receiver)
      if (oldValue !== value) {
        trigger(target, key)
      }
      return result
    },
    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const result = Reflect.deleteProperty(target, key)
      if (hadKey) {
        trigger(target, key)
      }
      return result
    }
  })
}

/**
 * Vue3 风格：ref（简化版）
 */
export function ref<T>(value: T): { value: T } {
  return reactive({ value })
}

/**
 * Vue3 风格：computed（简化版）
 *
 * 返回一个只读 ref：通过 watchEffect 保持 value 最新。
 */
export function computed<T>(getter: () => T): { readonly value: T } {
  const r = ref<T>(getter())
  watchEffect(() => {
    r.value = getter()
  })
  return r as { readonly value: T }
}

type WatchOptions = {
  immediate?: boolean
}

/**
 * Vue3 风格：watch（简化版）
 *
 * 支持：watch(() => state.xxx, (next, prev) => {})
 */
export function watch<T>(
  source: () => T,
  cb: (value: T, oldValue: T | undefined) => void,
  options: WatchOptions = {}
): () => void {
  let oldValue: T | undefined = undefined
  let inited = false

  const stop = effect(() => {
    const newValue = source()
    if (!inited) {
      inited = true
      if (options.immediate) {
        cb(newValue, oldValue)
      }
      oldValue = newValue
      return
    }
    if (newValue !== oldValue) {
      const prev = oldValue
      oldValue = newValue
      cb(newValue, prev)
    }
  })

  return stop
}

/**
 * Vue3 风格：watchEffect（简化版）
 */
export function watchEffect(fn: () => void): () => void {
  return effect(fn)
}

// ========== 类型导出 ==========
export type { ProxyStoreSubscriber }
export type SharedDataSubscriber<T = any> = (data: T) => void

// ========== 最推荐的调用方式（Vue3 reactive state） ==========

/**
 * 单例响应式状态（Vue3 风格）
 *
 * 用法：
 * watch(() => state.count, (v) => console.log(v));
 * state.count++;
 */
export const state = reactive(store.proxy)

export const subscribe = (
  key: string,
  subscriber: ProxyStoreSubscriber
): (() => void) => {
  return store.subscribe(key, subscriber)
}

export const unsubscribe = (
  key: string,
  subscriber: ProxyStoreSubscriber
): void => {
  store.unsubscribe(key, subscriber)
}

export const getSnapshot = (): Record<string, any> => {
  return store.getSnapshot()
}

export const batchUpdate = (updates: Record<string, any>): void => {
  store.batch(updates)
}

export const resetStore = (newState: Record<string, any> = {}): void => {
  store.reset(newState)
}

// ========== 共享数据（代理模式） ==========

/**
 * 发布共享数据（直接赋值即可）
 */
export const publishSharedData = <T>(key: string, data: T): void => {
  ;(state as any)[key] = data
}

/**
 * 获取共享数据
 */
export const getSharedData = <T>(key: string): T | undefined => {
  return (state as any)[key] as T | undefined
}

/**
 * 清除共享数据
 */
export const clearSharedData = (key: string): void => {
  delete (state as any)[key]
}

/**
 * 订阅共享数据变化
 */
export const subscribeSharedData = <T>(
  key: string,
  callback: SharedDataSubscriber<T>
): void => {
  if (!legacyWrapperMap.has(key)) {
    legacyWrapperMap.set(key, new WeakMap())
  }
  const perKeyMap = legacyWrapperMap.get(key)!

  const wrapper: ProxyStoreSubscriber = (value) => callback(value)
  perKeyMap.set(callback as unknown as Function, wrapper)
  subscribe(key, wrapper)
}

/**
 * 取消订阅共享数据变化
 */
export const unsubscribeSharedData = <T>(
  key: string,
  callback: SharedDataSubscriber<T>
): void => {
  const perKeyMap = legacyWrapperMap.get(key)
  const wrapper = perKeyMap?.get(callback as unknown as Function)
  if (wrapper) {
    unsubscribe(key, wrapper)
    perKeyMap?.delete(callback as unknown as Function)
    return
  }
  // fallback（尽力而为）
  store.unsubscribe(key, callback as unknown as ProxyStoreSubscriber)
}

// ========== 代理模式扩展 API ==========

/**
 * 获取代理对象（可直接操作）
 */
export const getProxy = (): Record<string, any> => {
  return state
}

/**
 * 订阅所有变化
 */
export const subscribeAll = (callback: ProxyStoreSubscriber): (() => void) => {
  return store.subscribeAll(callback)
}

// 导出实例（供高级用法）
export { ProxyStore, store }
