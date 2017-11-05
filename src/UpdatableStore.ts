import { FieldsUpdater, FieldUpdaters, FieldValues, NotAnArray, Updater } from 'immutable-lens'
import { Store } from './Store'

export interface UpdatableStore<State> {

   setValue(newValue: State): void

   update(updater: Updater<State>): void

   setFieldValues(this: Store<State & NotAnArray>,
                  newValues: FieldValues<State>): void

   updateFields(this: Store<State & NotAnArray>,
                updaters: FieldUpdaters<State>): void

   updateFieldValues(this: Store<State & NotAnArray>,
                     fieldsUpdater: FieldsUpdater<State>): void

   reset(this: Store<State>): void // TODO Remove explicit this type ?

   pipe(...updaters: Updater<State>[]): void

}
