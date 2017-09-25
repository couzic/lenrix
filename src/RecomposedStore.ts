import { Observable } from 'rxjs/Observable'
import { FieldExtractors, FieldLenses, Store } from './Store'
import { FieldUpdaters, FieldValues, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'

export class RecomposedStore<SourceState, State> implements Store<State> {

   public readonly state$: Observable<State>
   public readonly lens: UnfocusedLens<State>

   constructor(private readonly sourceStore: Store<SourceState>,
               private fieldLenses: FieldLenses<SourceState, State>) {
      this.state$ = sourceStore.extract(fieldLenses)
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

   extract<ExtractedState>(fields: FieldExtractors<State, ExtractedState>): Observable<ExtractedState> {
      throw Error('Not implemented yet')
   }

   setValue(newValue: State) {
      this.setFieldValues(newValue)
   }

   update(updater: Updater<State>) {
      this.sourceStore.update(sourceState => {
         const state = {} as any
         const updatedKeys = Object.keys(this.fieldLenses)
         updatedKeys.forEach(key => {
            const lens = (this.fieldLenses as any)[key]
            state[key] = lens.read(sourceState)
         })
         const newState = updater(state)
         const keys = Object.keys(newState)
         const updaters = keys.map(key => {
            const newValue = (newState as any)[key]
            const lens = (this.fieldLenses as any)[key]
            return lens.setValue(newValue)
         })
         return this.sourceStore.lens.pipe(...updaters)(sourceState)
      })
   }

   setFieldValues(newValues: FieldValues<State>) {
      const keys = Object.keys(newValues)
      const updaters = keys.map(key => {
         const newValue = (newValues as any)[key]
         const lens = (this.fieldLenses as any)[key]
         return lens.setValue(newValue)
      })
      this.sourceStore.pipe(...updaters)
   }

   updateFields(updaters: FieldUpdaters<State>) {
      const keys = Object.keys(updaters)
      const sourceUpdaters = keys.map(key => {
         const updater = (updaters as any)[key]
         const lens = (this.fieldLenses as any)[key]
         return lens.update(updater)
      })
      this.sourceStore.pipe(...sourceUpdaters)
   }

   pipe(...updaters: Updater<State>[]) {
   }

}
