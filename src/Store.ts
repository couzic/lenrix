import {Observable} from 'rxjs/Observable'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/map'
import {createLens, FieldUpdates, FieldValues, NotAnArray, UnfocusedLens, Update} from 'immutable-lens'

export interface Store<State> {

   readonly currentState: State
   readonly state$: Observable<State>
   readonly lens: UnfocusedLens<State>

   ////////////
   // FOCUS //
   //////////

   focusOn<K extends keyof State>(key: K): Store<State[K]>

   focusIndex<Item>(this: Store<Item[]>, index: number): Store<Item | undefined>

   ///////////
   // READ //
   /////////

   select<K extends keyof State>(key: K): Observable<State[K]>

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>>

   /////////////
   // UPDATE //
   ///////////

   setValue(newValue: State): void

   update(update: Update<State>): void

   setFieldValues(this: Store<State & NotAnArray>, newValues: FieldValues<State>): void

   updateFields(this: Store<State & NotAnArray>, fieldUpdates: FieldUpdates<State>): void

   pipe(...updates: Update<State>[]): void

}

export function createStore<State extends object & NotAnArray>(initialState: State): Store<State> {
   return {
      currentState: initialState,
      state$: Observable.of(initialState),
      lens: createLens(initialState),
      focusOn<K extends keyof State>(key: K): Store<State[K]> {
         return createStore(initialState[key])
      },
      select<K extends keyof State>(key: K): Observable<State[K]> {
         return this.state$.map((state: State) => state[key])
      },
      pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>> {
         return this.state$.map((state: State) => {
            const pick = {} as any
            keys.forEach(key => pick[key] = state[key])
            return pick
         })
      },
      setValue(newValue: State) {
      }
   } as any
}
