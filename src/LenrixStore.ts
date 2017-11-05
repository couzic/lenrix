import { Store } from './Store'
import { Observable } from 'rxjs/Observable'
import { cherryPick, createLens, FieldLenses, FieldsUpdater, FieldUpdaters, FieldValues, Lens, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'
import { shallowEquals } from './shallowEquals'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/publishBehavior'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { ComputedStore } from './ComputedStore'
import { ComputedStoreData, LenrixComputedStore } from './LenrixComputedStore'

export class LenrixStore<State> implements Store<State> {

   lens: UnfocusedLens<State> = createLens<State>()

   private readonly stateSubject: BehaviorSubject<State>

   get state$(): Observable<State> {
      return this.stateSubject
   }

   get currentState(): State {
      return this.stateSubject.getValue()
   }

   constructor(private injectedState$: Observable<State>,
               public readonly path: string,
               private readonly updateOnParent: (updater: Updater<State>) => void,
               private readonly initialState: State) {
      this.stateSubject = new BehaviorSubject(initialState)
      injectedState$.subscribe(this.stateSubject)
   }

   ////////////
   // FOCUS //
   //////////

   focusOn<K extends keyof State>(key: K): Store<State[K]> {
      const focusedLens = this.lens.focusOn(key)
      return this.focusWith(focusedLens)
   }

   focusPath(...keys: any[]): Store<any> {
      const focusedLens = (this.lens as any).focusPath(...keys)
      return this.focusWith(focusedLens)
   }

   focusWith<Target>(lens: Lens<State, Target>): Store<Target> {
      const focusedInitialState = lens.read(this.initialState)
      return new LenrixStore(
         this.map(state => lens.read(state)),
         this.path + lens.path,
         updater => this.update(lens.update(updater)),
         focusedInitialState)
   }

   focusFields<K extends keyof State>(this: Store<State & object>, ...keys: K[]): Store<Pick<State, K>> {
      const fields = {} as any
      keys.forEach(key => fields[key] = this.lens.focusOn(key))
      return this.recompose(fields)
   }

   recompose<RecomposedState>(this: LenrixStore<State & object>, fields: FieldLenses<State & object, RecomposedState>): Store<RecomposedState> {
      if (typeof fields === 'function') throw Error('recompose() does not accept functions as arguments. You should try map() instead')
      const recomposedLens = this.lens.recompose(fields)
      const recomposedState$ = this.state$.map(state => recomposedLens.read(state)).distinctUntilChanged(shallowEquals)
      const recomposedInitialState = recomposedLens.read(this.initialState)
      return new LenrixStore(
         recomposedState$,
         this.path + '.recomposed(' + Object.keys(fields).join(', ') + ')',
         (updater) => this.update(recomposedLens.update(updater)),
         recomposedInitialState)
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

   cherryPick<E>(this: Store<State & object>,
                 fields: FieldLenses<State & object, E>): Observable<E> {
      if (typeof fields === 'function') throw Error('cherryPick() does not accept functions as arguments. You should try map() instead')
      return this.state$.map(state => cherryPick(state, fields)).distinctUntilChanged(shallowEquals)
   }

   /////////////
   // UPDATE //
   ///////////

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

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues>(this: LenrixStore<State & object & NotAnArray>, computer: (state: State) => ComputedValues): ComputedStore<State, ComputedValues> {
      const computedValues = computer(this.initialState)
      const data$: Observable<ComputedStoreData<State, ComputedValues>> = this.state$.map(normalizedState => ({
         normalizedState,
         computedValues
      }))
      return new LenrixComputedStore(
         data$,
         this.path + '.compute(' + Object.keys(computedValues).join(', ') + ')',
         updater => this.update(updater as any),
         { normalizedState: this.initialState, computedValues }
      )
   }

   computeValues<ComputedValues>(values: {[K in keyof ComputedValues]: (state: State) => ComputedValues[K] }): ComputedStore<State, ComputedValues> {
      throw new Error('Method not implemented.')
   }

   compute$<ComputedValues>(computer$: (state$: Observable<State>) => Observable<ComputedValues>, initialValues: ComputedValues): ComputedStore<State, ComputedValues> {
      throw new Error('Method not implemented.')
   }

   computeValues$<ComputedValues>(values$: {[K in keyof ComputedValues]: (state$: Observable<State>) => Observable<ComputedValues[K]> }, initialValues: ComputedValues): ComputedStore<State, ComputedValues> {
      throw new Error('Method not implemented.')
   }
}
