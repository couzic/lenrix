import { LoggerOptions } from './LoggerOptions'

export const silentLoggerOptions: LoggerOptions = {
   console: {
      message: false,
      update: false,
      epic: false,
      compute: false,
      loading: false,
      loaded: false,
      error: false
   },
   redux: {
      message: false,
      epic: false,
      compute: false,
      loading: false,
      loaded: false
   }
}
