// SharedStateBridgeSingleton.ts

import { Registry } from './Registry'
import { SharedDataSubscriber, SharedStateBridge } from './SharedStateBridge'

// 单例子类
class SharedStateBridgeSingleton extends SharedStateBridge {
  private static instance: SharedStateBridgeSingleton

  private constructor() {
    super()
  }

  public static getInstance(): SharedStateBridgeSingleton {
    if (!SharedStateBridgeSingleton.instance) {
      SharedStateBridgeSingleton.instance = new SharedStateBridgeSingleton()
    }
    return this.instance
  }
}

// 获取单例
const singleton = SharedStateBridgeSingleton.getInstance()

// ========== 缓存注册表 ==========
const componentRegistry = new Registry<any>()

// ========== 类型导出 ==========
export type { SharedDataSubscriber }

export type ResourceUpdateCallback = (resourceType: string) => void

// ========== 共享数据（发布订阅） ==========
export const publishSharedData = singleton.publishSharedData.bind(singleton)
export const getSharedData = singleton.getSharedData.bind(singleton)
export const clearSharedData = singleton.clearSharedData.bind(singleton)
export const subscribeSharedData = singleton.subscribeSharedData.bind(singleton)
export const unsubscribeSharedData =
  singleton.unsubscribeSharedData.bind(singleton)

// ========== 工单组件缓存 ==========
export const getCachedServiceRequest =
  componentRegistry.get.bind(componentRegistry)
export const setCachedServiceRequest =
  componentRegistry.set.bind(componentRegistry)

// ========== 表单数据回调 ==========
export type GetFormDataCallback = () => Promise<{
  jsSn: string
  workOrderForm: any
  subWorkOrderDTOList?: Array<{ jsSn: string; workOrderForm: any }>
} | null>
const formCallbackRegistry = new Registry<GetFormDataCallback>()
export const registerFormDataCallback =
  formCallbackRegistry.set.bind(formCallbackRegistry)
export const getFormDataCallback =
  formCallbackRegistry.get.bind(formCallbackRegistry)
export const unregisterFormDataCallback =
  formCallbackRegistry.delete.bind(formCallbackRegistry)

// ========== 资源更新回调（单回调） ==========
const resourceCallbackRegistry = new Registry<ResourceUpdateCallback>()
const RESOURCE_KEY = 'update'
export const registerResourceUpdateCallback = (
  callback: ResourceUpdateCallback
) => resourceCallbackRegistry.set(RESOURCE_KEY, callback)
export const unregisterResourceUpdateCallback = () =>
  resourceCallbackRegistry.delete(RESOURCE_KEY)
export const triggerResourceAdd = (resourceType: string) => {
  const callback = resourceCallbackRegistry.get(RESOURCE_KEY)
  if (callback) {
    callback(resourceType)
  } else {
    console.warn(
      `No resource update callback registered, cannot add ${resourceType}`
    )
  }
}
