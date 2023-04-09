import { Store } from 'redux'

import { FocusedAction } from '../utility-types/FocusedAction'
import { LenrixError } from './LenrixError'
import { Logger } from './Logger'
import { defaultLoggerOptions, LoggerOptions } from './LoggerOptions'

const doNothing: any = (...params: any[]) => undefined

const createMessageLogger = (
   reduxStore: Store<any>,
   options: Required<LoggerOptions>
): Logger['message'] => {
   const logToConsole = options.console.message
      ? (action: FocusedAction) => {
           if (typeof console.groupCollapsed === 'function')
              console.groupCollapsed(
                 '%c 🔎 MESSAGE',
                 'background-color: rgb(128, 128, 0); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;',
                 action.type
              )
           console.log('payload', action.payload)
           console.log('meta', action.meta)
           if (typeof console.groupEnd === 'function') console.groupEnd()
        }
      : doNothing
   const logToRedux = options.redux.message
      ? (action: FocusedAction) =>
           reduxStore.dispatch({
              type: '[MESSAGE]' + action.type,
              payload: action.payload,
              meta: action.meta
           })
      : doNothing
   return (action: FocusedAction) => {
      logToConsole(action)
      logToRedux(action)
   }
}

const createUpdateLogger = (
   options: Required<LoggerOptions>
): Logger['update'] =>
   options.console.update
      ? (action: FocusedAction) => {
           if (typeof console.groupCollapsed === 'function')
              console.groupCollapsed(
                 '%c 🔎 UPDATE',
                 'background-color: rgb(32, 128, 32); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;',
                 action.type
              )
           console.log('payload', action.payload)
           console.log('meta', action.meta)
           if (typeof console.groupEnd === 'function') console.groupEnd()
        }
      : doNothing

const createEpicLogger = (
   reduxStore: Store<any>,
   options: Required<LoggerOptions>
): Logger['epic'] => {
   const logToConsole = options.console.epic
      ? (action: FocusedAction) => {
           if (typeof console.groupCollapsed === 'function')
              console.groupCollapsed(
                 '%c 🔎 EPIC',
                 'background-color: rgb(128, 32, 32); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;',
                 action.type
              )
           console.log('payload', action.payload)
           console.log('meta', action.meta)
           if (typeof console.groupEnd === 'function') console.groupEnd()
        }
      : doNothing
   const logToRedux = options.redux.epic
      ? (action: FocusedAction) =>
           reduxStore.dispatch({
              type: '[EPIC]' + action.type,
              payload: action.payload,
              meta: action.meta
           })
      : doNothing
   return (action: FocusedAction) => {
      logToConsole(action)
      logToRedux(action)
   }
}

const createComputeLogger = (
   reduxStore: Store<any>,
   options: Required<LoggerOptions>
): Logger['compute'] => {
   const loggableKeys = (previous: object, next: object): string[] =>
      Object.keys({ ...previous, ...next })
   const logToConsole = options.console.compute
      ? (previous: any, next: any) => {
           const keys = loggableKeys(previous, next)
           const safePrevious = previous || {} // previous is undefined when computed values are logged for the first time
           if (typeof console.groupCollapsed === 'function')
              console.groupCollapsed(
                 '%c 🔎 COMPUTE',
                 'background-color: rgb(32, 32, 128); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;',
                 keys
              )
           keys.forEach(key =>
              console.log(key, ':', safePrevious[key], '→', next[key])
           )
           if (typeof console.groupEnd === 'function') console.groupEnd()
        }
      : doNothing
   const logToRedux = options.redux.compute
      ? (previous: object, next: object) =>
           reduxStore.dispatch({
              type: '[COMPUTE]' + loggableKeys(previous, next).join(', ')
           })
      : doNothing
   return (previous: object | null | undefined, next: object) => {
      logToConsole(previous, next)
      logToRedux(previous, next)
   }
}

const createLoadingLogger = (
   reduxStore: Store<any>,
   options: Required<LoggerOptions>
): Logger['loading'] => {
   const logToConsole = options.console.loading
      ? (selection: any) => {
           if (typeof console.groupCollapsed === 'function')
              console.groupCollapsed(
                 '%c 🔎 LOADING',
                 'background-color: rgb(192, 32, 128); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;'
              )
           console.log(selection)
           if (typeof console.groupEnd === 'function') console.groupEnd()
        }
      : doNothing
   const logToRedux = options.redux.loading
      ? () =>
           reduxStore.dispatch({
              type: '[LOADING]'
           })
      : doNothing
   return loadedValues => {
      logToConsole(loadedValues)
      logToRedux(loadedValues)
   }
}

const createLoadedLogger = (
   reduxStore: Store<any>,
   options: Required<LoggerOptions>
): Logger['loaded'] => {
   const logToConsole = options.console.loaded
      ? (values: object) => {
           const keys = Object.keys(values)
           if (typeof console.groupCollapsed === 'function')
              console.groupCollapsed(
                 '%c 🔎 LOADED',
                 'background-color: rgb(128, 32, 128); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;',
                 keys
              )
           keys.forEach(key => console.log(key, ':', (values as any)[key]))
           if (typeof console.groupEnd === 'function') console.groupEnd()
        }
      : doNothing
   const logToRedux = options.redux.loaded
      ? (values: object) =>
           reduxStore.dispatch({
              type: '[LOADED]' + Object.keys(values).join(', ')
           })
      : doNothing
   return loadedValues => {
      logToConsole(loadedValues)
      logToRedux(loadedValues)
   }
}

const createErrorLogger = (options: Required<LoggerOptions>): Logger['error'] =>
   options.console.error
      ? (error: LenrixError) => {
           if (typeof console.groupCollapsed === 'function')
              console.groupCollapsed(
                 '%c 🔎  ⚠️ ERROR ⚠️',
                 'background-color: red; color: #fff; padding: 2px 8px 2px 0; border-radius:6px;',
                 error.source.type
              )
           console.log('source', error.source)
           console.log('nativeError', error.nativeError)
           if (typeof console.groupEnd === 'function') console.groupEnd()
        }
      : doNothing

export const createLogger = (
   reduxStore: Store<any, any>,
   userOptions: LoggerOptions = defaultLoggerOptions
): Logger => {
   const console = { ...defaultLoggerOptions.console, ...userOptions.console }
   const redux = { ...defaultLoggerOptions.redux, ...userOptions.redux }
   const options = { console, redux }
   const message = createMessageLogger(reduxStore, options)
   const update = createUpdateLogger(options)
   const epic = createEpicLogger(reduxStore, options)
   const compute = createComputeLogger(reduxStore, options)
   const loading = createLoadingLogger(reduxStore, options)
   const loaded = createLoadedLogger(reduxStore, options)
   const error = createErrorLogger(options)
   return { message, update, epic, compute, loading, loaded, error }
}
