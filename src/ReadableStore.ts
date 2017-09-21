import { Observable } from 'rxjs/Observable'
import { shallowEquals } from './shallowEquals'
import { FieldExtractors } from './Store'

export abstract class ReadableStore<State> {

   readonly state$: Observable<State>

   pluck<K extends keyof State>(key: K): Observable<State[K]> {
      return this.map(state => state[key])
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      return this.state$.map(selector).distinctUntilChanged()
   }

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>> {
      return this.state$.map(state => {
         const subset = {} as any
         keys.forEach(key => subset[key] = state[key])
         return subset
      }).distinctUntilChanged(shallowEquals)
   }

   extract<E>(fields: FieldExtractors<State, E>): Observable<E> {
      if (typeof fields === 'function') throw Error('extract() does not accept functions as arguments. You should try map() instead')
      const keys = Object.keys(fields)
      return this.state$.map(state => {
         const extraction = {} as any
         keys.forEach(key => {
            const selectorOrLens = (fields as any)[key]
            extraction[key] = typeof selectorOrLens === 'function'
               ? selectorOrLens(state)
               : selectorOrLens.read(state)
         })
         return extraction
      }).distinctUntilChanged(shallowEquals)
   }

}
