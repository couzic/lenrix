export type IsPlainObject<T> = T extends any[]
   ? false
   : T extends (...args: any[]) => any
   ? false
   : T extends Date
   ? false
   : T extends object
   ? true
   : false
