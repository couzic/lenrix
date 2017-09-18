import { createLens, FieldUpdaters, FieldValues, UnfocusedLens, Updater } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/publishReplay'
import 'rxjs/add/operator/distinctUntilChanged'
import { Store } from './Store'
import { Subject } from 'rxjs/Subject'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { shallowEquals } from './shallowEquals'
import { FocusedStore } from './FocusedStore'

export class RootStore<State extends object> implements Store<State> {

   private readonly updaters$ = new Subject<Updater<State>>()
   public readonly state$: Observable<State>

   public readonly lens: UnfocusedLens<State> = createLens<State>()

   constructor(private readonly initialState: State) {
      const stateSubject = new BehaviorSubject(initialState)
      this.updaters$
         .scan((state, updater) => updater(state), initialState)
         .subscribe(stateSubject)
      this.state$ = stateSubject.distinctUntilChanged()
   }

   focusOn<K extends keyof State>(key: K): Store<State[K]> {
      return new FocusedStore(this, this.select(key))
   }

   select<K extends keyof State>(key: K): Observable<State[K]> {
      return this.map(state => state[key])
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      return this.state$
         .map(selector)
         .distinctUntilChanged()
   }

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>> {
      return this.map(state => {
         const subset = {} as any
         keys.forEach(key => subset[key] = state[key])
         return subset
      }).distinctUntilChanged(shallowEquals)
   }

   setValue(newValue: State) {
      this.updaters$.next(() => newValue)
   }

   update(updater: Updater<State>) {
      this.updaters$.next(this.lens.update(updater))
   }

   setFieldValues(newValues: FieldValues<State>) {
      this.updaters$.next(this.lens.setFieldValues(newValues))
   }

   updateFields(updaters: FieldUpdaters<State>) {
      this.updaters$.next(this.lens.updateFields(updaters))
   }

   pipe(...updaters: Updater<State>[]) {
      this.updaters$.next(this.lens.pipe(...updaters))
   }
}
