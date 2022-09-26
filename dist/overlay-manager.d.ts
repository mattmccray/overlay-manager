import { ReadableAtom } from 'nanostores';
declare type CloseHandler = (done: Function) => void;
export interface IOverlayOptions {
    escCloses?: boolean;
}
export interface IOverlay<T = any, O = any> {
    id: string;
    isTopmost: ReadableAtom<boolean>;
    returnValue: (value: T, error?: any) => void;
    view: any;
    params?: Record<string, any>;
    options?: O;
    onRequestClose: (handler: CloseHandler) => void;
}
export declare function createOverlayManager<O = IOverlayOptions>(name: string, cancelReason?: any): {
    name: string;
    isActive: ReadableAtom<boolean>;
    topmost: ReadableAtom<IOverlay<any, any>>;
    show: <T = any>(view: any, params?: Record<string, any>, options?: O) => Promise<T>;
    stopEscListening: () => void;
    overlays: ReadableAtom<IOverlay<any, any>[]>;
};
export declare type IOverlayManager = ReturnType<typeof createOverlayManager>;
export interface Deferred<T> extends Promise<T> {
    innerPromise: Promise<T>;
    isResolved: boolean;
}
interface DeferredController<T> {
    isResolved: boolean;
    resolve(value: T | PromiseLike<T>): void;
    reject(reason?: any): void;
}
export declare function createDeferred<T>(): [Deferred<T>, DeferredController<T>];
declare type KeyboardEventCallback = (e: KeyboardEvent) => void | boolean;
/**
 * Callbacks should return `true` to prevent calling other callbacks in the stack.
 */
export declare function useEscHandler(callback: KeyboardEventCallback): () => void;
export declare function removeEscHandler(callback: KeyboardEventCallback): void;
export {};
