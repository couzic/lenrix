import { PlainObject } from 'immutable-lens'

export type ExcludeKeys<T extends PlainObject, K extends keyof T> = {
   [P in keyof T]: P extends K ? never : T[P]
}[keyof T]
