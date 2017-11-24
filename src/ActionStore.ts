import { FieldLenses, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'

import { ActionComputedStore } from './ActionComputedStore'
import { ReadableStore } from './ReadableStore'
import { StoreType } from './Store'
import { UpdatableStore } from './UpdatableStore'

export type FocusedHandlers<State, Actions> = {[ActionType in keyof Actions]?: (payload: Actions[ActionType]) => Updater<State> }

export interface ActionStoreType<State, Actions> extends StoreType<State> {
   actions: Actions
}

export interface ActionStore<Type extends ActionStoreType<any, any>> extends ReadableStore<Type['state']>, UpdatableStore<Type['state']> {

   //////////////
   // ACTIONS //
   ////////////

   actionTypes<NewActions>(): ActionStore<{
      state: Type['state']
      actions: Type['actions'] & NewActions
   }>

   actionHandlers(
      focusedHandlers: (lens: UnfocusedLens<Type['state']>) => FocusedHandlers<Type['state'], Type['actions']>
   ): ActionStore<Type>

   dispatch: {[ActionType in keyof Type['actions']]: (payload: Type['actions'][ActionType]) => void}

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues extends object & NotAnArray>(
      this: ActionStore<{ state: Type['state'] & object & NotAnArray, actions: Type['actions'] }>,
      computer: (state: Type['state']) => ComputedValues
   ): ActionComputedStore<{
      normalizedState: Type['state']
      computedValues: ComputedValues
      actions: Type['actions']
   }>

   computeFrom<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      this: ActionStore<{ state: Type['state'] & object & NotAnArray, actions: Type['actions'] }>,
      selection: FieldLenses<Type['state'], Selection>,
      computer: (selection: Selection) => ComputedValues
   ): ActionComputedStore<{
      normalizedState: Type['state']
      computedValues: ComputedValues
      actions: Type['actions']
   }>

   // TODO Implement
   // computeFromFields<K extends keyof State, ComputedValues extends object & NotAnArray>(
   //    this: Store<State & object & NotAnArray>,
   //    fields: K[],
   //    computer: (fields: Pick<State, K>) => ComputedValues
   // ): ComputedStore<State, ComputedValues>

   compute$<ComputedValues extends object & NotAnArray>(
      this: ActionStore<{ state: Type['state'] & object & NotAnArray, actions: Type['actions'] }>,
      computer$: (state$: Observable<Type['state']>) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): ActionComputedStore<{
      normalizedState: Type['state']
      computedValues: ComputedValues
      actions: Type['actions']
   }>

   compute$<ComputedValues extends object & NotAnArray>(
      this: ActionStore<{ state: Type['state'] & object & NotAnArray, actions: Type['actions'] }>,
      computer$: (state$: Observable<Type['state']>) => Observable<ComputedValues>
   ): ActionComputedStore<{
      normalizedState: Type['state'],
      computedValues: Partial<ComputedValues>
      actions: Type['actions']
   }>
}
