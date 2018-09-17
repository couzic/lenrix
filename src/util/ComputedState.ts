import { PlainObject } from 'immutable-lens'

import { ExcludeFields } from './ExcludeFields'

/**
 * Extract from T the fields that are present in U
 */
type ExtractFields<T extends PlainObject, U extends PlainObject> = {
   [K in Extract<keyof T, keyof U>]: T[K]
}

export type ComputedState<
   Type extends {
      state: PlainObject
      computedValues: PlainObject
   }
> = {
   [K in keyof (Type['state'] & Type['computedValues'])]: (ExcludeFields<
      Type['state'] & Type['computedValues'],
      Type['computedValues']
   > &
      Type['computedValues'])[K]
}
