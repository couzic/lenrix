import {Observable} from 'rxjs/Observable'
import {FieldsUpdater, Lens, UnfocusedLens, ValueUpdater} from './Lens'

export interface FocusAt<T, Target> {
   at: Lens<T, Target>
}

export interface SetValue<Target> {
   setValue: Target
}

export type LensFocusedSetValue<T, Target> = FocusAt<T, Target> & SetValue<Target>

export interface UpdateValue<Target> {
   update: ValueUpdater<Target>
}

export type LensFocusedUpdateValue<T, Target> = FocusAt<T, Target> & UpdateValue<Target>

// export interface UpdateFields<Target> {
//    updateFields: FieldsUpdater<Target>
// }

// export type FocusedUpdateFields<T, Target> = UpdateFields<Target> & FocusAt<T, Target>

export type SetValueCommand<T, Target> = SetValue<Target> | LensFocusedSetValue<T, Target>
export type UpdateValueCommand<T, Target> = UpdateValue<Target> | LensFocusedUpdateValue<T, Target>
// export type UpdateFieldsCommand<T, Target> = UpdateFields<Target> | FocusedUpdateFields<T, Target>

export type StoreCommand<State, FocusedState> =
   SetValueCommand<State, FocusedState>
   | UpdateValueCommand<State, FocusedState>
// | UpdateFieldsCommand<State, FocusedState> TODO Submit github issue to catch compilation errors

const c: StoreCommand<{ a: number, b: number }, { a: number, b: number }> = {
   setValue: {a: 1, b: 2},
   update: (v) => v
}

export type UnfocusedStoreCommand<State> = StoreCommand<State, State>

export interface StateCommandsBuilder<State> {
   setValue(newValue: State): UnfocusedStoreCommand<State>

   update(updater: ValueUpdater<State>): UnfocusedStoreCommand<State>

   updateFields(fields: object & FieldsUpdater<State>): UnfocusedStoreCommand<State>

   setValueOn<K extends keyof State>(key: K, newValue: State[K]): StoreCommand<State, State[K]>

   updateOn<K extends keyof State>(key: K, updater: ValueUpdater<State[K]>): StoreCommand<State, State[K]>

   updateFieldsOn<K extends keyof State>(key: K, fields: FieldsUpdater<State[K]>): StoreCommand<State, State[K]>

   setValueAt<FocusedState>(focus: Lens<State, FocusedState>, newValue: FocusedState): StoreCommand<State, FocusedState>

   updateAt<FocusedState>(focus: Lens<State, FocusedState>, updater: ValueUpdater<FocusedState>): StoreCommand<State, FocusedState>

   updateFieldsAt<FocusedState extends object>(focus: Lens<State, FocusedState>, fields: FieldsUpdater<FocusedState>): StoreCommand<State, FocusedState>
}

export interface Store<State> {

   readonly currentState: State

   // TODO: .distinctUntilChange()
   readonly state$: Observable<State>

   readonly lens: UnfocusedLens<State>

   readonly commands: StateCommandsBuilder<State>

   select<K extends keyof State>(key: K): Observable<State[K]>

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>>

   focusOn<K extends keyof State>(key: K): Store<State[K]>

   focusAt<FocusedState>(lens: Lens<State, FocusedState>): Store<FocusedState>

   focusIndex<Item>(this: Store<Item[]>, index: number): Store<Item | undefined>

   setValue(newValue: State): void

   update(updater: ValueUpdater<State>): void

   updateFields(fields: FieldsUpdater<State>): void

   // TODO check either setValue OR update
   execute<FocusedState>(command: StoreCommand<State, FocusedState>): void

   execute<T1, T2>(command1: StoreCommand<State, T1>,
                   command2: StoreCommand<State, T2>): void

   execute<T1, T2, T3>(command1: StoreCommand<State, T1>,
                       command2: StoreCommand<State, T2>,
                       command3: StoreCommand<State, T3>): void

   execute<T1, T2, T3, T4>(command1: StoreCommand<State, T1>,
                           command2: StoreCommand<State, T2>,
                           command3: StoreCommand<State, T3>,
                           command4: StoreCommand<State, T4>): void

   execute<T1, T2, T3, T4, T5>(command1: StoreCommand<State, T1>,
                               command2: StoreCommand<State, T2>,
                               command3: StoreCommand<State, T3>,
                               command4: StoreCommand<State, T4>,
                               command5: StoreCommand<State, T5>): void

   execute<T1, T2, T3, T4, T5, T6>(command1: StoreCommand<State, T1>,
                                   command2: StoreCommand<State, T2>,
                                   command3: StoreCommand<State, T3>,
                                   command4: StoreCommand<State, T4>,
                                   command5: StoreCommand<State, T5>,
                                   command6: StoreCommand<State, T6>): void

}

export function createStore<RootState extends object>(initialState: RootState): Store<RootState> {
   return {} as any
}
