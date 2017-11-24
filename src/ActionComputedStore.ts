import { NotAnArray, UnfocusedLens } from 'immutable-lens'

import { FocusedHandlers } from './ActionStore'
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
      actions: Type['actions'] & NewActions
   }>

   actionHandlers(
      focusedHandlers: (lens: UnfocusedLens<Type['normalizedState']>) => FocusedHandlers<Type['normalizedState'], Type['actions']>
   ): ActionComputedStore<Type>

   dispatch: {[ActionType in keyof Type['actions']]: (payload: Type['actions'][ActionType]) => void}

}
