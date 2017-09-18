import { Store } from './Store'
import { createLens, FieldUpdaters, FieldValues, UnfocusedLens, Updater } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'

export class FocusedStore<ParentState, State extends object> implements Store<State> {

   lens: UnfocusedLens<State> = createLens<State>()

   constructor(private readonly parentStore: Store<ParentState>,
               public readonly state$: Observable<State>) {
   }

   focusOn<K extends keyof State>(key: K): Store<State[K]> {
      throw new Error('Method not implemented.')
   }

   select<K extends keyof State>(key: K): Observable<State[K]> {
      throw new Error('Method not implemented.')
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      throw new Error('Method not implemented.')
   }

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>> {
      throw new Error('Method not implemented.')
   }

   setValue(newValue: State): void {
      throw new Error('Method not implemented.')
   }

   update(updater: Updater<State>): void {
      throw new Error('Method not implemented.')
   }

   setFieldValues(newValues: FieldValues<State>): void {
      throw new Error('Method not implemented.')
   }

   updateFields(updaters: FieldUpdaters<State>): void {
      throw new Error('Method not implemented.')
   }

   pipe(...updaters: Updater<State>[]): void {
      throw new Error('Method not implemented.')
   }

}
