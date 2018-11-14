export interface LoggerOptions {
   console?: ConsoleLoggerOptions
   redux?: ReduxLoggerOptions
}

type ReduxLogSource = 'message' | 'epic' | 'compute'
type ConsoleLogSource = ReduxLogSource | 'update' | 'error'

type ConsoleLoggerOptions = { [K in ConsoleLogSource]?: boolean }

const defaultConsoleLoggerOptions: { [K in ConsoleLogSource]: boolean } = {
   message: true,
   update: true,
   epic: true,
   compute: true,
   error: true
}

type ReduxLoggerOptions = { [K in ReduxLogSource]?: boolean }

const defaultReduxLoggerOptions: { [K in ReduxLogSource]: boolean } = {
   message: false,
   epic: false,
   compute: false
}

export const defaultLoggerOptions: LoggerOptions = {
   console: defaultConsoleLoggerOptions,
   redux: defaultReduxLoggerOptions
}
