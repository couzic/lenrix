import { ReadableStore } from './ReadableStore'
import { UpdatableStore } from './UpdatableStore'
import { Observable } from 'rxjs/Observable'
import { cherryPick, createLens, FieldLenses, FieldsUpdater, FieldUpdaters, FieldValues, UnfocusedLens, Updater } from 'immutable-lens'
import { shallowEquals } from './shallowEquals'

export abstract class LenrixAbstractStore<NormalizedState, ComputedValues, State extends NormalizedState & ComputedValues> implements ReadableStore<State>, UpdatableStore<NormalizedState> {

   lens: UnfocusedLens<NormalizedState> = createLens<NormalizedState>()
   state$: Observable<State>
   currentState: State
   path: string

   constructor(private readonly updateOnParent: (updater: Updater<NormalizedState>) => void,
               protected readonly initialState: NormalizedState) {
   }

   ///////////
   // READ //
   /////////

   pluck<K extends keyof State>(key: K): Observable<State[K]> {
      return this.map(state => state[key])
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      return this.state$.map(selector).distinctUntilChanged()
   }

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>> {
      return this.state$.map(state => {
         const subset = {} as any
         keys.forEach(key => subset[key] = state[key])
         return subset
      }).distinctUntilChanged(shallowEquals)
   }

   cherryPick<E>(this: ReadableStore<State & object>, fields: FieldLenses<State & object, E>): Observable<E> {
      if (typeof fields === 'function') throw Error('cherryPick() does not accept functions as arguments. You should try map() instead')
      return this.state$.map(state => cherryPick(state, fields)).distinctUntilChanged(shallowEquals)
   }

   /////////////
   // UPDATE //
   ///////////

   reset() {
      this.setValue(this.initialState)
   }

   setValue(newValue: NormalizedState) {
      this.updateOnParent(this.lens.setValue(newValue))
   }

   update(updater: Updater<NormalizedState>) {
      this.updateOnParent(this.lens.update(updater))
   }

   setFieldValues(newValues: FieldValues<NormalizedState>) {
      this.updateOnParent(this.lens.setFieldValues(newValues))
   }

   updateFields(updaters: FieldUpdaters<NormalizedState>) {
      this.updateOnParent(this.lens.updateFields(updaters))
   }

   updateFieldValues(fieldsUpdater: FieldsUpdater<NormalizedState>) {
      this.updateOnParent(this.lens.updateFieldValues(fieldsUpdater))
   }

   pipe(...updaters: Updater<NormalizedState>[]) {
      this.updateOnParent(this.lens.pipe(...updaters))
   }

}
