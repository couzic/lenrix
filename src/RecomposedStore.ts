import { Observable } from 'rxjs/Observable'
import { FieldLenses, Store } from './Store'
import { createComposedLens, createLens, FieldUpdaters, FieldValues, Lens, UnfocusedLens, Updater } from 'immutable-lens'
import { ReadableStore } from './ReadableStore'
import { shallowEquals } from './shallowEquals'
import { FocusedStore } from './FocusedStore'

export class RecomposedStore<ParentState extends object, State> extends ReadableStore<State> implements Store<State> {

   public readonly lens: UnfocusedLens<State> = createLens<State>()
   public readonly state$: Observable<State>

   private readonly recomposedLens: Lens<ParentState, State>

   constructor(private readonly parentStore: Store<ParentState>,
               private fields: FieldLenses<ParentState, State>) {
      super()
      this.state$ = parentStore.extract(fields)
      this.recomposedLens = createComposedLens<ParentState>().withFields(fields)
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      return this.state$.map(selector).distinctUntilChanged(shallowEquals)
   }

   focusOn<K extends keyof State>(key: K): Store<State[K]> {
      return new FocusedStore(this.pluck(key), (updater) => this.lens.focusOn(key).update(updater))
   }

   recompose<RecomposedState>(fields: FieldLenses<State, RecomposedState>): Store<RecomposedState> {
      throw Error('Not implemented yet')
   }

   setValue(newValue: State) {
      this.parentStore.update(this.recomposedLens.setValue(newValue))
   }

   update(updater: Updater<State>) {
      this.parentStore.update(this.recomposedLens.update(updater))
   }

   setFieldValues(newValues: FieldValues<State>) {
      this.parentStore.update(this.recomposedLens.setFieldValues(newValues))
   }

   updateFields(updaters: FieldUpdaters<State>) {
      this.parentStore.update(this.recomposedLens.updateFields(updaters))
   }

   pipe(...updaters: Updater<State>[]) {
      this.parentStore.update(this.recomposedLens.pipe(...updaters))
   }

}
