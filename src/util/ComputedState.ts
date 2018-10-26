import { PlainObject } from 'immutable-lens'

import { ExcludeFields } from './ExcludeFields'

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
