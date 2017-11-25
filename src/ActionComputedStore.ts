import { NotAnArray, UnfocusedLens } from 'immutable-lens'

import { ActionDispatchers } from './ActionDispatch'
import { FocusedHandlers } from './FocusedHandlers'
import { MergedFields } from './MergedFields'
import { ReadableStore } from './ReadableStore'
import { UpdatableStore } from './UpdatableStore'

export interface ActionComputedStore<Type extends {
   normalizedState: object & NotAnArray
   computedValues: any
   actions: any
}> extends ReadableStore<Type['normalizedState'] & Type['computedValues']>, UpdatableStore<Type['normalizedState']> {

   actionTypes<NewActions>(): ActionComputedStore<{
      normalizedState: Type['normalizedState']
      computedValues: Type['computedValues']
      actions: MergedFields<Type['actions'], NewActions>
   }>

   actionHandlers(
      focusedHandlers: (lens: UnfocusedLens<Type['normalizedState']>) => FocusedHandlers<Type['normalizedState'], Type['actions']>
   ): ActionComputedStore<Type>

   actions: ActionDispatchers<Type['actions']>

}
