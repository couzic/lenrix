import { Store } from 'redux'

import { FocusedAction } from '../FocusedAction'
import { Logger } from './Logger'
import { defaultLoggerOptions, LoggerOptions } from './LoggerOptions'

const doNothing = (...params: any[]) => { }

const createMessageLogger = (reduxStore: Store<any>, options: LoggerOptions): Logger['message'] => {
   if (!options.console!.message && !options.redux!.message) {
      return doNothing
   } else {
      const logToConsole = options.console!.message
         ? (action: FocusedAction) => console.log('[MESSAGE]' + action.type)
         : doNothing
      const logToRedux = options.redux!.message
         ? (action: FocusedAction) => reduxStore.dispatch({ type: '[MESSAGE]' + action.type })
         : doNothing
      return (action: FocusedAction) => {
         logToConsole(action)
         logToRedux(action)
      }
   }
}

const createUpdateLogger = (options: LoggerOptions): Logger['update'] => {
   return options.console!.update
      ? (action: FocusedAction) => console.log('[UPDATE]' + action.type)
      : doNothing
}

const createEpicLogger = (reduxStore: Store<any>, options: LoggerOptions): Logger['epic'] => {
   if (!options.console!.epic && !options.redux!.epic) {
      return doNothing
   } else {
      const logToConsole = options.console!.epic
         ? (action: FocusedAction) => console.log('[EPIC]' + action.type)
         : doNothing
      const logToRedux = options.redux!.epic
         ? (action: FocusedAction) => reduxStore.dispatch({ type: '[EPIC]' + action.type })
         : doNothing
      return (action: FocusedAction) => {
         logToConsole(action)
         logToRedux(action)
      }
   }
}

const createComputeLogger = (reduxStore: Store<any>, options: LoggerOptions): Logger['compute'] => {
   const loggableKeys = (previous: object, next: object): string => Object.keys(Object.assign(previous, next)).join(',')
   if (!options.console!.compute && !options.redux!.compute) {
      return doNothing
   } else {
      const logToConsole = options.console!.compute
         ? (previous: object, next: object) => console.log('[COMPUTE]' + loggableKeys(previous, next))
         : doNothing
      const logToRedux = options.redux!.compute
         ? (previous: object, next: object) => reduxStore.dispatch({ type: '[COMPUTE]' + loggableKeys(previous, next) })
         : doNothing
      return (previous: object, next: object) => {
         logToConsole(previous, next)
         logToRedux(previous, next)
      }
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
