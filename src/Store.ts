import {Observable} from 'rxjs/Observable'
import {FieldsUpdater, Lens, UnfocusedLens, ValueUpdater} from './Lens'

interface FocusAt<T, Target> {
   at: Lens<T, Target>
}

interface SetValue<Target> {
   setValue: Target
}

interface LensFocusedSetValue<T, Target>  extends SetValue<Target>, FocusAt<T, Target> {
}

interface UpdateValue<Target> {
   update: ValueUpdater<Target>
}

interface LensFocusedUpdateValue<T, Target>  extends UpdateValue<Target>, FocusAt<T, Target> {
}

interface UpdateFields<Target> {
   updateFields: FieldsUpdater<Target>
}

interface FocusedUpdateFields<T, Target> extends UpdateFields<Target>, FocusAt<T, Target> {
}

type SetValueCommand<T, Target> = SetValue<Target> | LensFocusedSetValue<T, Target>
type UpdateValueCommand<T, Target> = UpdateValue<Target> | LensFocusedUpdateValue<T, Target>
type UpdateFieldsCommand<T, Target> = UpdateFields<Target> | FocusedUpdateFields<T, Target>

export type FocusedCommand<State, FocusedState> =
   SetValueCommand<State, FocusedState>
   | UpdateValueCommand<State, FocusedState>
// | UpdateFieldsCommand<State, FocusedState> TODO Submit github issue to catch compilation errors

export type StateCommand<State> = FocusedCommand<State, State>

export interface StateCommands<State> {
   setValue(newValue: State): StateCommand<State>

   update(updater: ValueUpdater<State>): StateCommand<State>

   updateFields(fields: object & FieldsUpdater<State>): StateCommand<State>

   setValueOn<K extends keyof State>(key: K, newValue: State[K]): FocusedCommand<State, State[K]>

   updateOn<K extends keyof State>(key: K, updater: ValueUpdater<State[K]>): FocusedCommand<State, State[K]>

   updateFieldsOn<K extends keyof State>(key: K, fields: FieldsUpdater<State[K]>): FocusedCommand<State, State[K]>

   setValueAt<FocusedState>(focus: Lens<State, FocusedState>, newValue: FocusedState): FocusedCommand<State, FocusedState>

   updateAt<FocusedState>(focus: Lens<State, FocusedState>, updater: ValueUpdater<FocusedState>): FocusedCommand<State, FocusedState>

   updateFieldsAt<FocusedState extends object>(focus: Lens<State, FocusedState>, fields: FieldsUpdater<FocusedState>): FocusedCommand<State, FocusedState>
}

export interface Store<State> {

   readonly currentState: State

   // TODO: .distinctUntilChange()
   readonly state$: Observable<State>

   readonly lens: UnfocusedLens<State>

   readonly commands: StateCommands<State>

   select<K extends keyof State>(key: K): Observable<State[K]>

   pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>>

   focusOn<K extends keyof State>(key: K): Store<State[K]>

   focusAt<FocusedState>(lens: Lens<State, FocusedState>): Store<FocusedState>

   focusIndex<Item>(this: Store<Item[]>, index: number): Store<Item | undefined>

   setValue(newValue: State)

   update(updater: ValueUpdater<State>)

   updateFields(fields: FieldsUpdater<State>)

   execute<FocusedState>(command: FocusedCommand<State, FocusedState>)

   execute<T1, T2>(command1: FocusedCommand<State, T1>,
                   command2: FocusedCommand<State, T2>)

   execute<T1, T2, T3>(command1: FocusedCommand<State, T1>,
                       command2: FocusedCommand<State, T2>,
                       command3: FocusedCommand<State, T3>)

   execute<T1, T2, T3, T4>(command1: FocusedCommand<State, T1>,
                           command2: FocusedCommand<State, T2>,
                           command3: FocusedCommand<State, T3>,
                           command4: FocusedCommand<State, T4>)

   execute<T1, T2, T3, T4, T5>(command1: FocusedCommand<State, T1>,
                               command2: FocusedCommand<State, T2>,
                               command3: FocusedCommand<State, T3>,
                               command4: FocusedCommand<State, T4>,
                               command5: FocusedCommand<State, T5>)

   execute<T1, T2, T3, T4, T5, T6>(command1: FocusedCommand<State, T1>,
                                   command2: FocusedCommand<State, T2>,
                                   command3: FocusedCommand<State, T3>,
                                   command4: FocusedCommand<State, T4>,
                                   command5: FocusedCommand<State, T5>,
                                   command6: FocusedCommand<State, T6>)

}

export function createRootStore<RootState extends object>(initialState: RootState): Store<RootState> {
   return {} as any
}
