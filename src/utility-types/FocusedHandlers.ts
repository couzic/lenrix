import { Updater } from 'immutable-lens'

import { FocusedUpdater } from './FocusedUpdater'
import { StoreType } from './StoreType'

export type FocusedHandlers<Type extends StoreType> = {
   [ActionType in keyof Type['actions']]?: (
      payload: Type['actions'][ActionType]
   ) => FocusedUpdater<Type> | Updater<Type['state']>
}
