import { NotAnArray } from 'immutable-lens'

import { FocusedUpdater } from './FocusedUpdater'

export type FocusedHandlers<Type extends {
   state: object & NotAnArray
   computedValues: object
   actions: object
}> = {[ActionType in keyof Type['actions']]?: (payload: Type['actions'][ActionType]) => FocusedUpdater<Type> }
