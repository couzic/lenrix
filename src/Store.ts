import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/distinctUntilChanged'
import { FieldUpdaters, FieldValues, Lens, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'

export type ExtractedFields<State, ExtractedState> = object & NotAnArray & {[K in keyof ExtractedState]: (state: State) => ExtractedState[K]}

export type RecomposedFields<State, RecomposedState> = object & NotAnArray & {[K in keyof RecomposedState]: Lens<State, RecomposedState[K]>}

export interface Store<State> {

   readonly state$: Observable<State>
   readonly lens: UnfocusedLens<State>

   ////////////
   // FOCUS //
   //////////

   focusOn<K extends keyof State>(this: Store<State & NotAnArray>, key: K): Store<State[K]>

   // TODO API Design
   // focusWith<U>(this: Store<State & object & NotAnArray>, lens: Lens<State, U>): Store<U> // Maybe unnecessary, store can already focus
   // focusFields<K extends keyof State>(this: Store<State & object & NotAnArray>, ...keys: K[]): Store<Pick<State, K>>
   // recompose<RecomposedState>(this: Store<State & object & NotAnArray>, fields: RecomposedFields<State, RecomposedState>): Store<RecomposedState>

   ///////////
   // READ //
   /////////

   pluck<K extends keyof State>(this: Store<State & NotAnArray>, key: K): Observable<State[K]>

   map<T>(selector: (state: State) => T): Observable<T>

   pick<K extends keyof State>(this: Store<State & NotAnArray>, ...keys: K[]): Observable<Pick<State, K>>

   extract<ExtractedState>(this: Store<State>, selectors: ExtractedFields<State, ExtractedState>): Observable<ExtractedState>

   /////////////
   // UPDATE //
   ///////////

   setValue(newValue: State): void

   update(updater: Updater<State>): void

   setFieldValues(this: Store<State & NotAnArray>, newValues: FieldValues<State>): void

   updateFields(this: Store<State & NotAnArray>, updaters: FieldUpdaters<State>): void

   pipe(...updaters: Updater<State>[]): void

}
