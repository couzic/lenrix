import { Observable } from 'rxjs/Observable'
import { shallowEquals } from './shallowEquals'
import { FieldLenses, Store } from './Store'
import { extract, Lens, UnfocusedLens } from 'immutable-lens'

export abstract class AbstractStore<State> {

   readonly state$: Observable<State>
   readonly lens: UnfocusedLens<State>

   abstract map<T>(selector: (state: State) => T): Observable<T>

   abstract focusWith<Target>(lens: Lens<State, Target>): Store<Target>

   focusPath(...keys: any[]): Store<any> {
      const focusedLens = (this.lens as any).focusPath(...keys)
      return this.focusWith(focusedLens)
   }

   pluck<K extends keyof State>(key: K): Observable<State[K]> {
      return this.map(state => state[key])
   }

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>> {
      return this.state$.map(state => {
         const subset = {} as any
         keys.forEach(key => subset[key] = state[key])
         return subset
      }).distinctUntilChanged(shallowEquals)
   }

   extract<E>(this: Store<State & object>,
              fields: FieldLenses<State, E>): Observable<E> {
      if (typeof fields === 'function') throw Error('extract() does not accept functions as arguments. You should try map() instead')
      return this.state$.map(state => extract(state, fields)).distinctUntilChanged(shallowEquals)
   }

}
