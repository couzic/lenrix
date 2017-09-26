import { createLens, FieldUpdaters, FieldValues, Lens, UnfocusedLens, Updater } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/publishReplay'
import 'rxjs/add/operator/distinctUntilChanged'
import { FieldLenses, Store } from './Store'
import { Subject } from 'rxjs/Subject'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { FocusedStore } from './FocusedStore'
import { AbstractStore } from './AbstractStore'
import { RecomposedStore } from './RecomposedStore'

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
      return new FocusedStore(this.pluck(key), updater => this.update(focusedLens.update(updater)))
   }

   focusWith<Target>(lens: Lens<State, Target>): Store<Target> {
      return new FocusedStore(this.map(state => lens.read(state)), updater => this.update(lens.update(updater)))
   }

   recompose<RecomposedState>(fields: FieldLenses<State, RecomposedState>): Store<RecomposedState> {
      return new RecomposedStore<State, RecomposedState>(this, fields)
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
