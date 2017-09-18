import { createLens, FieldUpdaters, FieldValues, UnfocusedLens, Updater } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/publishReplay'
import 'rxjs/add/operator/distinctUntilChanged'
import { Store } from './Store'
import { Subject } from 'rxjs/Subject'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { FocusedStore } from './FocusedStore'
import { ReadableStore } from './ReadableStore'

export class RootStore<State extends object> extends ReadableStore<State> implements Store<State> {

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

   focusOn<K extends keyof State>(key: K): Store<State[K]> {
      const focusedLens = this.lens.focusOn(key)
      return new FocusedStore(this.select(key), updater => this.update(focusedLens.update(updater)))
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
