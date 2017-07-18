import {Observable} from 'rxjs/Observable'
import {FieldsUpdater, Lens, UnfocusedLens, ValueUpdater} from './Lens'

// interface WithFocus<T, Target> {
//     focus: Lens<T, Target>
// }

// export interface SetValueCommand<T, Target> extends WithFocus<T, Target> {
//     setValue: Target
// }
//
// export interface UpdateValueCommand<T, Target> {
//     update: ValueUpdater<Target>
// }
//
// export interface UpdateFieldsCommand<T, Target> {
//     updateFields: FieldsUpdater<Target>
// }

// export type StateCommand<State, FocusedState> =
//     SetValueCommand<State, FocusedState>
//     | UpdateValueCommand<State, FocusedState>
//     | UpdateFieldsCommand<State, FocusedState>

const fieldsUpdater: { input: number; toto: number } = {input: 42, toto: 42}
// const command: StateCommand<{ input: number }> = {updateFields: fieldsUpdater}

// export type FocusedCommand<State, FocusedState> =
//     { focus: Lens<State, FocusedState>, setValue: FocusedState }
//     | { focus: Lens<State, FocusedState>, update: ValueUpdater<FocusedState> }
//     | { focus: Lens<State, FocusedState>, updateFields: object & { [K in keyof FocusedState]: FocusedState[K] | ValueUpdater<FocusedState[K]> } }

export interface FocusedCommand<State, FocusedState> {
}

export interface StateCommand<State> extends FocusedCommand<State, State> {
}

export interface StateCommands<State> {
    setValue(newValue: State): StateCommand<State>

    update(updater: ValueUpdater<State>): StateCommand<State>

    updateFields(fields: object & FieldsUpdater<State>): StateCommand<State>

    setValue<FocusedState>(focus: Lens<State, FocusedState>, newValue: FocusedState): FocusedCommand<State, FocusedState>

    update<FocusedState>(focus: Lens<State, FocusedState>, updater: ValueUpdater<FocusedState>): FocusedCommand<State, FocusedState>

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

    focus<FocusedState>(lens: Lens<State, FocusedState>): Store<FocusedState>

    setValue(newValue: State)

    update(updater: ValueUpdater<State>)

    updateFields(spec: FieldsUpdater<State>)

    buildSetValueCommand<Target>(lens: Lens<State, Target>, value: Target): FocusedCommand<State, Target>

    execute<FocusedState>(...commands: FocusedCommand<State, FocusedState>[])

    executeAll<FocusedState>(commands: FocusedCommand<State, FocusedState>[])

}

export function createRootStore<RootState extends object>(initialState: RootState): Store<RootState> {
    return {} as any
}