import { PlainObject } from 'immutable-lens'

export type NullableKeys<T extends PlainObject> = NonNullable<
   { [K in keyof T]: T[K] extends NonNullable<T[K]> ? never : K }[keyof T]
>
