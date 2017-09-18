import { Store } from './Store'
import { createLens, FieldUpdaters, FieldValues, UnfocusedLens, Updater } from 'immutable-lens'
import { ReadableStore } from './ReadableStore'
import { Observable } from 'rxjs/Observable'

export class FocusedStore<ParentState, K extends keyof ParentState, State extends ParentState[K] & object>
   extends ReadableStore<State> implements Store<State> {

   lens: UnfocusedLens<State> = createLens<State>()

   constructor(public readonly state$: Observable<State>,
               private readonly updateOnParent: (updater: Updater<State>) => void) {
      super()
   }

   focusOn<K extends keyof State>(key: K): Store<State[K]> {
      const focusedLens = this.lens.focusOn(key)
      return new FocusedStore(this.select(key), updater => this.update(focusedLens.update(updater)))
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

   pipe(...updaters: Updater<State>[]) {
      this.updateOnParent(this.lens.pipe(...updaters))
   }

}
