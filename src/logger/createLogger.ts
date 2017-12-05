import { Store } from 'redux'

import { FocusedAction } from '../FocusedAction'
import { Logger } from './Logger'
import { defaultLoggerOptions, LoggerOptions } from './LoggerOptions'

const doNothing = (...params: any[]) => { }

const createMessageLogger = (reduxStore: Store<any>, options: LoggerOptions): Logger['message'] => {
   const logToConsole = options.console!.message
      ? (action: FocusedAction) => {
         console.groupCollapsed('%c 🔎 MESSAGE', 'background-color: rgb(128, 128, 0); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;', action.type)
         console.log('payload', action.payload)
         console.log('meta', action.meta)
         console.groupEnd()
         console.log('[MESSAGE]' + action.type)
      }
      : doNothing
   const logToRedux = options.redux!.message
      ? (action: FocusedAction) => reduxStore.dispatch({ type: '[MESSAGE]' + action.type, payload: action.payload, meta: action.meta })
      : doNothing
   return (action: FocusedAction) => {
      logToConsole(action)
      logToRedux(action)
   }
}

const createUpdateLogger = (options: LoggerOptions): Logger['update'] => {
   return options.console!.update
      ? (action: FocusedAction) => {
         console.groupCollapsed('%c 🔎 UPDATE', 'background-color: rgb(32, 128, 32); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;', action.type)
         console.log('payload', action.payload)
         console.log('meta', action.meta)
         console.groupEnd()
      }
      : doNothing
}

const createEpicLogger = (reduxStore: Store<any>, options: LoggerOptions): Logger['epic'] => {
   const logToConsole = options.console!.epic
      ? (action: FocusedAction) => {
         console.groupCollapsed('%c 🔎 EPIC', 'background-color: rgb(128, 32, 32); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;', action.type)
         console.log('payload', action.payload)
         console.log('meta', action.meta)
         console.groupEnd()
      }
      : doNothing
   const logToRedux = options.redux!.epic
      ? (action: FocusedAction) => reduxStore.dispatch({ type: '[EPIC]' + action.type, payload: action.payload, meta: action.meta })
      : doNothing
   return (action: FocusedAction) => {
      logToConsole(action)
      logToRedux(action)
   }
}

const createComputeLogger = (reduxStore: Store<any>, options: LoggerOptions): Logger['compute'] => {
   const loggableKeys = (previous: object, next: object): string[] => Object.keys(Object.assign(previous, next))
   const logToConsole = options.console!.compute
      ? (previous: any, next: any) => {
         const keys = Object.keys(Object.assign(previous, next))
         console.groupCollapsed('%c 🔎 COMPUTE', 'background-color: rgb(32, 32, 128); color: #fff; padding: 2px 8px 2px 0; border-radius:6px;', keys)
         keys.forEach(key => console.log(key, ':', previous[key], '→', next[key]))
         console.groupEnd()
      }
      : doNothing
   const logToRedux = options.redux!.compute
      ? (previous: object, next: object) => reduxStore.dispatch({ type: '[COMPUTE]' + loggableKeys(previous, next).join(', ') })
      : doNothing
   return (previous: object, next: object) => {
      logToConsole(previous, next)
      logToRedux(previous, next)
   }
}

export const createLogger = (reduxStore: Store<any>, userOptions: LoggerOptions = defaultLoggerOptions): Logger => {
   const console = { ...defaultLoggerOptions.console, ...userOptions.console }
   const redux = { ...defaultLoggerOptions.redux, ...userOptions.redux }
   const options = { console, redux }
   const message: Logger['message'] = createMessageLogger(reduxStore, options)
   const update: Logger['update'] = createUpdateLogger(options)
   const epic: Logger['epic'] = createEpicLogger(reduxStore, options)
   const compute: Logger['compute'] = createComputeLogger(reduxStore, options)
   return { message, update, epic, compute }
}
