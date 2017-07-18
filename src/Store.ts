import {Observable} from 'rxjs/Observable'
import {FieldsUpdater, Lens, UnfocusedLens, ValueUpdater} from './Lens'

interface WithFocus<T, Target> {
    focus: Lens<T, Target>
}

export interface SetValueCommand<T, Target> extends WithFocus<T, Target> {
    setValue: Target
}

export interface UpdateValueCommand<T, Target> {
    update: ValueUpdater<Target>
}

export interface UpdateFieldsCommand<T, Target> {
    updateFields: FieldsUpdater<Target>
}

export type StateCommand<State, FocusedState> =
    SetValueCommand<State, FocusedState>
    | UpdateValueCommand<State, FocusedState>
    | UpdateFieldsCommand<State, FocusedState>

const fieldsUpdater: { input: number; toto: number } = {input: 42, toto: 42}
// const command: StateCommand<{ input: number }> = {updateFields: fieldsUpdater}

export type FocusedCommand<State, FocusedState> =
    { focus: Lens<State, FocusedState> } & StateCommand<State, FocusedState>

// export interface StateCommands<State> {
//     setValue<Target>(lens: Lens<State, Target>, newValue: Target): FocusedCommand<State, Target>
//
//     update<Target>(lens: Lens<State, Target>, updater: ValueUpdater<Target>): FocusedCommand<State, Target>
//
//     updateFields<Target extends object>(spec: FieldsUpdater<Target>): FocusedCommand<State, Target>
// }

export interface Store<State> {

    readonly currentState: State

    // TODO: .distinctUntilChange()
    readonly state$: Observable<State>

    readonly lens: UnfocusedLens<State>

    // readonly commands: StateCommands<State>

    select<K extends keyof State>(key: K): Observable<State[K]>

    pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>>

    focusOn<K extends keyof State>(key: K): Store<State[K]>

    focus<FocusedState>(lens: Lens<State, FocusedState>): Store<FocusedState>

    setValue(newValue: State)

    update(updater: ValueUpdater<State>)

    updateFields(spec: FieldsUpdater<State>)

    buildSetValueCommand<Target>(lens: Lens<State, Target>, value: Target): FocusedCommand<State, Target>

    execute<T1>(command: FocusedCommand<State, T1>)

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

}

export function createRootStore<RootState extends object>(initialState: RootState): Store<RootState> {
    return {} as any
}