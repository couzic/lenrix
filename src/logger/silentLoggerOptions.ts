import { LoggerOptions } from './LoggerOptions'

export const silentLoggerOptions: LoggerOptions = {
   console: {
      message: false,
      update: false,
      epic: false,
      compute: false
   },
   redux: {
      message: false,
      epic: false,
      compute: false
   }
}
