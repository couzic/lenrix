import { Observable } from 'rxjs/Observable'
import { shallowEquals } from './shallowEquals'
import { ExtractedFields } from './Store'

export abstract class ReadableStore<State> {

   readonly state$: Observable<State>

   pluck<K extends keyof State>(key: K): Observable<State[K]> {
      return this.map(state => state[key])
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      return this.state$.map(selector).distinctUntilChanged()
   }

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>> {
      return this.map(state => {
         const subset = {} as any
         keys.forEach(key => subset[key] = state[key])
         return subset
      }).distinctUntilChanged(shallowEquals)
   }

   extract<E>(selectors: ExtractedFields<State, E>): Observable<E> {
      throw Error('Not implemented yet')
   }

}
