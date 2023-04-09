import { PlainObject } from 'immutable-lens'

/**
 * Exclude from T the fields that are present in U
 */
export type ExcludeFields<T extends PlainObject, U extends PlainObject> = {
   [K in Exclude<keyof T, keyof U>]: T[K]
}
