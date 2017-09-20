import { Observable } from 'rxjs/Observable'
import { FieldUpdaters, FieldValues, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'

export interface Store<State> {

   readonly state$: Observable<State>
   readonly lens: UnfocusedLens<State>

   ////////////
   // FOCUS //
   //////////

   focusOn<K extends keyof State>(this: Store<State & NotAnArray>, key: K): Store<State[K]>

   ///////////
   // READ //
   /////////

   pluck<K extends keyof State>(this: Store<State & NotAnArray>, key: K): Observable<State[K]>

   map<T>(selector: (state: State) => T): Observable<T>

   pick<K extends keyof State>(this: Store<State & NotAnArray>, ...keys: K[]): Observable<Pick<State, K>>

   /////////////
   // UPDATE //
   ///////////

   setValue(newValue: State): void

   update(updater: Updater<State>): void

   setFieldValues(this: Store<State & NotAnArray>, newValues: FieldValues<State>): void

   updateFields(this: Store<State & NotAnArray>, updaters: FieldUpdaters<State>): void

   pipe(...updaters: Updater<State>[]): void

}
