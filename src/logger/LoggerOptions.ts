export interface LoggerOptions {
   console?: {
      message?: boolean
      update?: boolean
      epic?: boolean
      compute?: boolean
   }
   redux?: {
      message?: boolean
      epic?: boolean
      compute?: boolean
   }
}

const defaultConsoleLoggerOptions: LoggerOptions['console'] = {
   message: true,
   update: true,
   epic: true,
   compute: true,
}

const defaultReduxLoggerOptions: LoggerOptions['redux'] = {
   message: false,
   epic: false,
   compute: false,
}

export const defaultLoggerOptions: LoggerOptions = {
   console: defaultConsoleLoggerOptions,
   redux: defaultReduxLoggerOptions,
}
