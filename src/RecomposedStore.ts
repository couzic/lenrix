import { Observable } from 'rxjs/Observable'
import { FieldLenses, Store } from './Store'
import { createComposedLens, createLens, FieldUpdaters, FieldValues, Lens, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'

export class RecomposedStore<ParentState extends object, State> implements Store<State> {

   public readonly lens: UnfocusedLens<State> = createLens<State>()
   public readonly state$: Observable<State>

   private readonly recomposedLens: Lens<ParentState, State>

   constructor(private readonly parentStore: Store<ParentState>,
               private fields: FieldLenses<ParentState, State>) {
      this.state$ = parentStore.extract(fields)
      this.recomposedLens = createComposedLens<ParentState>().withFields(fields)
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      // return this.state$.map(selector).distinctUntilChanged()
      throw Error('Not implemented yet')
   }

   focusOn<K extends keyof State>(key: K): Store<State[K]> {
      throw Error('Not implemented yet')
   }

   recompose<RecomposedState>(fields: FieldLenses<State, RecomposedState>): Store<RecomposedState> {
      throw Error('Not implemented yet')
   }

   pluck<K extends keyof State>(key: K): Observable<State[K]> {
      throw Error('Not implemented yet')
   }

   pick<K extends keyof State>(this: Store<State & NotAnArray>, ...keys: K[]): Observable<Pick<State, K>> {
      throw Error('Not implemented yet')
   }

   extract<ExtractedState>(fields: FieldLenses<State, ExtractedState>): Observable<ExtractedState> {
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
