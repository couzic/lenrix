import { NotAnArray } from 'immutable-lens'

export type MergedFields<
   A extends object & NotAnArray,
   B extends object & NotAnArray
> = { [K in keyof (A & B)]: (A & B)[K] }
