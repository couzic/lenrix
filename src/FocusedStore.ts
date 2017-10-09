import { Store } from './Store'
import { createComposedLens, createLens, FieldsUpdater, FieldUpdaters, FieldValues, Lens, UnfocusedLens, Updater } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'
import { AbstractStore } from './AbstractStore'

export class FocusedStore<State> extends AbstractStore<State> implements Store<State> {

   lens: UnfocusedLens<State> = createLens<State>()

   constructor(public readonly state$: Observable<State>,
               private readonly updateOnParent: (updater: Updater<State>) => void,
               private readonly initialState: State) {
      super()
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

   recompose<RecomposedState>(this: FocusedStore<State & object>, fields: any): Store<RecomposedState> {
      const composedLens = createComposedLens<any>().withFields(fields)
      const composedState$ = this.extract(fields) as Observable<RecomposedState>
      const composedInitialState = composedLens.read(this.initialState) as RecomposedState
      return new FocusedStore(composedState$, (updater) => this.update(composedLens.update(updater)), composedInitialState)
   }

   reset() {
      this.setValue(this.initialState)
   }

   setValue(newValue: State) {
      this.updateOnParent(this.lens.setValue(newValue))
   }

   update(updater: Updater<State>) {
      this.updateOnParent(this.lens.update(updater))
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
