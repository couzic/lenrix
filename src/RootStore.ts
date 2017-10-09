import { createComposedLens, createLens, FieldsUpdater, FieldUpdaters, FieldValues, Lens, UnfocusedLens, Updater } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/publishReplay'
import 'rxjs/add/operator/distinctUntilChanged'
import { Store } from './Store'
import { Subject } from 'rxjs/Subject'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { FocusedStore } from './FocusedStore'
import { AbstractStore } from './AbstractStore'

export class RootStore<State extends object> extends AbstractStore<State> implements Store<State> {

   private readonly updaters$ = new Subject<Updater<State>>()

   public readonly state$: Observable<State>
   public readonly lens: UnfocusedLens<State> = createLens<State>()

   constructor(private readonly initialState: State) {
      super()
      const stateSubject = new BehaviorSubject(initialState)
      this.updaters$
         .scan((state, updater) => updater(state), initialState)
         .subscribe(stateSubject)
      this.state$ = stateSubject.distinctUntilChanged()
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      return this.state$.map(selector).distinctUntilChanged()
   }

   focusOn<K extends keyof State>(key: K): Store<State[K]> {
      const focusedLens = this.lens.focusOn(key)
      const focusedInitialState = focusedLens.read(this.initialState)
      return new FocusedStore(this.pluck(key), updater => this.update(focusedLens.update(updater)), focusedInitialState)
   }

   focusWith<Target>(lens: Lens<State, Target>): Store<Target> {
      const focusedInitialState = lens.read(this.initialState)
      return new FocusedStore(this.map(state => lens.read(state)), updater => this.update(lens.update(updater)), focusedInitialState)
   }

   recompose<RecomposedState>(this: RootStore<State & object>, fields: any): Store<RecomposedState> {
      const composedState$ = this.extract(fields) as Observable<RecomposedState>
      const composedLens = createComposedLens<any>().withFields(fields)
      const composedInitialState = composedLens.read(this.initialState) as RecomposedState
      return new FocusedStore(composedState$, (updater) => this.update(composedLens.update(updater)), composedInitialState)
   }

   reset() {
      this.setValue(this.initialState)
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

   updateFieldValues(fieldsUpdater: FieldsUpdater<State>) {
      this.updaters$.next(this.lens.updateFieldValues(fieldsUpdater))
   }

   pipe(...updaters: Updater<State>[]) {
      this.updaters$.next(this.lens.pipe(...updaters))
   }
}
