import { FieldsUpdater, FieldUpdaters, FieldValues, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'
import { Store } from './Store'

export interface UpdatableStore<State> {

   readonly lens: UnfocusedLens<State>

   setValue(newValue: State): void

   setFieldValues(this: UpdatableStore<State & NotAnArray>,
                  newValues: FieldValues<State>): void

   update(updater: Updater<State>): void

   updateFields(this: UpdatableStore<State & NotAnArray>,
                updaters: FieldUpdaters<State>): void

   updateFieldValues(this: UpdatableStore<State & NotAnArray>,
                     fieldsUpdater: FieldsUpdater<State>): void

   reset(this: UpdatableStore<State>): void // TODO Remove explicit this type ?

   pipe(...updaters: Updater<State>[]): void

}
