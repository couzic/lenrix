import { FieldLenses, Store } from './Store'
import { createLens, FieldsUpdater, FieldUpdaters, FieldValues, Lens, UnfocusedLens, Updater } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'
import { RecomposedStore } from './RecomposedStore'
import { AbstractStore } from './AbstractStore'

export class FocusedStore<ParentState, K extends keyof ParentState, State extends ParentState[K] & object>
   extends AbstractStore<State> implements Store<State> {

   lens: UnfocusedLens<State> = createLens<State>()

   constructor(public readonly state$: Observable<State>,
               private readonly updateOnParent: (updater: Updater<State>) => void) {
      super()
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
      return new RecomposedStore(this, fields)
   }

   setValue(newValue: State) {
      this.updateOnParent(() => newValue)
   }

   update(updater: Updater<State>) {
      this.updateOnParent(updater)
   }

   setFieldValues(newValues: FieldValues<State>) {
      this.updateOnParent(this.lens.setFieldValues(newValues))
   }

   updateFields(updaters: FieldUpdaters<State>) {
      this.updateOnParent(this.lens.updateFields(updaters))
   }

   updateFieldValues(fieldsUpdater: FieldsUpdater<State>) {
      this.updateOnParent(this.lens.updateFieldValues(fieldsUpdater))
   }

   pipe(...updaters: Updater<State>[]) {
      this.updateOnParent(this.lens.pipe(...updaters))
   }

}
