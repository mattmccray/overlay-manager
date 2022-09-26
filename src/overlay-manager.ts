import { atom, computed, ReadableAtom } from 'nanostores'

type CloseHandler = (done: Function) => void

export interface IOverlayOptions {
  escCloses?: boolean
}

export interface IOverlay<T = any, O = any> {
  id: string
  isTopmost: ReadableAtom<boolean>
  returnValue: (value: T, error?: any) => void
  view: any // Depends on view layer...
  params?: Record<string, any>
  options?: O
  onRequestClose: (handler: CloseHandler) => void
}

export function createOverlayManager<O = IOverlayOptions>(name: string, cancelReason: any = null) {
  const overlays = atom<IOverlay[]>([])
  const isActive = computed(overlays, (list) => list.length > 0)
  const topmost = computed(overlays, (list) => list[list.length - 1])
  const public_overlays = computed(overlays, (list) => list)
  const stopEscListening = useEscHandler(handleEsc)


  async function show<T = any>(view: any, params?: Record<string, any>, options?: O): Promise<T> {
    let close_handler: CloseHandler = (done: Function) => done()
    const id = Date.now().toString(36)
    const isTopmost = computed(topmost, (dlg) => dlg?.id === id)
    const [deferred_value, deferred_ctrl] = createDeferred<T>()

    const new_overlay: IOverlay = {
      id, view, params, options, isTopmost, returnValue, onRequestClose
    }

    overlays.set([
      ...overlays.get(),
      new_overlay
    ])

    return deferred_value.innerPromise

    function returnValue(value: T, error?: any) {
      close_handler(() => {
        if (!!error || error === cancelReason) {
          deferred_ctrl.reject(error)
        }
        else {
          deferred_ctrl.resolve(value)
        }
        overlays.set([
          ...overlays.get().filter(o => o.id !== id)
        ])
      })
    }
    function onRequestClose(handler: CloseHandler) {
      close_handler = handler
    }
  }

  return { name, isActive, topmost, show, stopEscListening, overlays: public_overlays }

  function handleEsc(e: KeyboardEvent) {
    const overlay = topmost.get();
    if (!overlay) return
    overlay.returnValue(null, cancelReason)
  }
}

export type IOverlayManager = ReturnType<typeof createOverlayManager>

export interface Deferred<T> extends Promise<T> {
  innerPromise: Promise<T>
  isResolved: boolean
}

interface DeferredController<T> {
  isResolved: boolean
  resolve(value: T | PromiseLike<T>): void
  reject(reason?: any): void
}

export function createDeferred<T>(): [Deferred<T>, DeferredController<T>] {
  const controller: DeferredController<T> = {
    isResolved: false,
    resolve: null as any,
    reject: null as any,
  }

  const innerPromise = new Promise<T>((resolve, reject) => {
    controller.resolve = (value) => {
      controller.isResolved = true
      resolve(value)
    }
    controller.reject = (reason) => {
      controller.isResolved = true
      reject(reason)
    }
  })

  const deferred: Deferred<T> = Object.assign(innerPromise, {
    innerPromise,
    get isResolved() {
      return controller.isResolved
    },
  })

  return [deferred, controller]
}


type KeyboardEventCallback = (e: KeyboardEvent) => void | boolean

const _handlers = atom<KeyboardEventCallback[]>([])
const _isActive = computed(_handlers, (list) => list.length > 0)

/**
 * Callbacks should return `true` to prevent calling other callbacks in the stack.
 */
export function useEscHandler(callback: KeyboardEventCallback) {
  const list = _handlers.get()
  list.unshift(callback)
  _handlers.set(list)

  return () => {
    removeEscHandler(callback)
  }
}

export function removeEscHandler(callback: KeyboardEventCallback) {
  const list = _handlers.get()
  _handlers.set(list.filter(cb => cb !== callback))
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && !e.repeat) {
    const list = _handlers.get()

    for (let index = 0; index < list.length; index++) {
      const callback = list[index];
      const response = callback(e)

      if (response === true) {
        e.preventDefault()
        e.stopPropagation()
        break;
      }
    }
  }
}

_isActive.subscribe((isActive) => {
  if (isActive) {
    window.addEventListener("keydown", handleKeyDown)
  }
  else {
    window.removeEventListener("keydown", handleKeyDown)
  }
})
