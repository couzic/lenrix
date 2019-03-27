import { PlainObject } from 'immutable-lens'

import { ExcludeFields } from './ExcludeFields'

export type OutputState<
   Type extends {
      state: PlainObject
      readonlyValues: PlainObject
   }
> = {
   [K in keyof (Type['state'] & Type['readonlyValues'])]: (ExcludeFields<
      Type['state'] & Type['readonlyValues'],
      Type['readonlyValues']
   > &
      Type['readonlyValues'])[K]
}
