// 工单组件缓存
const componentRegistry = new Map<string, any>()

// 工单表单数据回调注册表
const formDataCallbackRegistry = new Map<string, GetFormDataCallback>()

// 资源更新回调注册表（用于子工单通知主工单添加资源）
let resourceUpdateCallback: ResourceUpdateCallback | null = null

// 跨工单共享数据存储
const sharedDataRegistry = new Map<string, any>()

// 共享数据订阅者注册表
const sharedDataSubscribers = new Map<string, Set<SharedDataSubscriber>>()

/**
 * 获取工单表单数据的回调函数类型
 * @returns Promise 返回符合 CreateWorkOrderDTO 结构的数据，或 null 表示验证失败
 */
export type GetFormDataCallback = () => Promise<{
  jsSn: string
  workOrderForm: any
  subWorkOrderDTOList?: Array<{ jsSn: string; workOrderForm: any }>
} | null>

/**
 * 资源更新回调函数类型
 * @param resourceType 要添加的资源类型（如 'F5LoadApplication'）
 */
export type ResourceUpdateCallback = (resourceType: string) => void

export function getCachedServiceRequest(id: string) {
  return componentRegistry.get(id)
}

export function setCachedServiceRequest(id: string, instance: any) {
  componentRegistry.set(id, instance)
}

/**
 * 注册工单的 getFormData 回调
 */
export function registerFormDataCallback(
  id: string,
  callback: GetFormDataCallback
) {
  formDataCallbackRegistry.set(id, callback)
}

/**
 * 获取工单的 getFormData 回调
 */
export function getFormDataCallback(
  id: string
): GetFormDataCallback | undefined {
  return formDataCallbackRegistry.get(id)
}

/**
 * 清除工单的 getFormData 回调（组件卸载时调用）
 */
export function unregisterFormDataCallback(id: string) {
  formDataCallbackRegistry.delete(id)
}

/**
 * 注册资源更新回调（主工单调用）
 * 用于子工单通知主工单添加新的资源类型
 */
export function registerResourceUpdateCallback(
  callback: ResourceUpdateCallback
) {
  resourceUpdateCallback = callback
}

/**
 * 清除资源更新回调（主工单卸载时调用）
 */
export function unregisterResourceUpdateCallback() {
  resourceUpdateCallback = null
}

/**
 * 触发资源添加（子工单调用）
 * @param resourceType 要添加的资源类型（如 'F5LoadApplication'）
 */
export function triggerResourceAdd(resourceType: string) {
  if (resourceUpdateCallback) {
    resourceUpdateCallback(resourceType)
  } else {
    console.warn(
      `No resource update callback registered, cannot add ${resourceType}`
    )
  }
}

/**
 * 共享数据订阅者类型
 * @param data 共享的数据
 */
export type SharedDataSubscriber = (data: any) => void

/**
 * 发布共享数据（数据源工单调用）
 * @param key 数据标识（如 'ExtDNSResolution.domainList'）
 * @param data 要共享的数据
 */
export function publishSharedData(key: string, data: any) {
  sharedDataRegistry.set(key, data)
  // 通知所有订阅者
  const subscribers = sharedDataSubscribers.get(key)
  if (subscribers) {
    subscribers.forEach((callback) => callback(data))
  }
}

/**
 * 获取共享数据
 * @param key 数据标识
 */
export function getSharedData(key: string): any {
  return sharedDataRegistry.get(key)
}

/**
 * 清除共享数据
 * @param key 数据标识
 */
export function clearSharedData(key: string) {
  sharedDataRegistry.delete(key)
  // 通知所有订阅者数据已清除
  const subscribers = sharedDataSubscribers.get(key)
  if (subscribers) {
    subscribers.forEach((callback) => callback(null))
  }
}

/**
 * 订阅共享数据变化
 * @param key 数据标识
 * @param callback 数据变化时的回调
 */
export function subscribeSharedData(
  key: string,
  callback: SharedDataSubscriber
) {
  if (!sharedDataSubscribers.has(key)) {
    sharedDataSubscribers.set(key, new Set())
  }
  sharedDataSubscribers.get(key)!.add(callback)

  // 如果已有数据，立即通知订阅者
  const existingData = sharedDataRegistry.get(key)
  if (existingData !== undefined) {
    callback(existingData)
  }
}

/**
 * 取消订阅共享数据变化
 * @param key 数据标识
 * @param callback 之前注册的回调
 */
export function unsubscribeSharedData(
  key: string,
  callback: SharedDataSubscriber
) {
  const subscribers = sharedDataSubscribers.get(key)
  if (subscribers) {
    subscribers.delete(callback)
  }
}
