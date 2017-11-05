import { FieldUpdaters, FieldValues, NotAnArray } from 'immutable-lens'
import { Store } from './Store'

export interface UpdatableStore<State> {

   setValue(newValue: State): void

   setFieldValues(this: Store<State & NotAnArray>,
                  newValues: FieldValues<State>): void

   updateFields(this: Store<State & NotAnArray>,
                updaters: FieldUpdaters<State>): void

   reset(this: Store<State>): void // TODO Remove explicit this type ?

}
