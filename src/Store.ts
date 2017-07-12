import {FocusedCommand, UpdateSpec, ValueUpdater} from './update'
import {Observable} from 'rxjs/Observable'
import {Lens, UnfocusedLens} from './Lens'

export interface StateCommands<State> {
    setValue<Target>(lens: Lens<State, Target>, newValue: Target): FocusedCommand<State, Target>
    update<Target>(lens: Lens<State, Target>, updater: ValueUpdater<Target>): FocusedCommand<State, Target>
    updateState<Target extends object>(spec: UpdateSpec<Target>): FocusedCommand<State, Target>
}

// export interface StateCommandsFromBuilder<State> {
//     setValue<Target>(builder: (state: State) => lens: Lens<State, Target>, newValue: Target): FocusedCommand<State, Target>
//     update<Target>(lens: Lens<State, Target>, updater: ValueUpdater<Target>): FocusedCommand<State, Target>
//     updateState<Target extends object>(spec: UpdateSpec<Target>): FocusedCommand<State, Target>
// }

export interface Store<State> {

    readonly currentState: State

    // TODO: .distinctUntilChange()
    readonly state$: Observable<State>

    readonly lens: UnfocusedLens<State>

    readonly commands: StateCommands<State>

    select<K extends keyof State>(key: K): Observable<State[K]>

    pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>>

    focusOn<K extends keyof State>(key: K): Store<State[K]>

    focusWith<Target>(lens: Lens<State, Target>): Store<Target>

    setValue(newValue: State)

    update(updater: ValueUpdater<State>)

    // TODO runtime check : Not a function
    updateState(spec: UpdateSpec<State>)

    buildSetValueCommand<Target>(lens: Lens<State, Target>, value: Target): FocusedCommand<State, Target>

    // TODO runtime check : either 'at' or 'focusWith', either 'updateState' or 'update'
    execute<T1>(command1: FocusedCommand<State, T1>)

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

    // TODO runtime check : either 'at' or 'focusWith', either 'updateState' or 'update'
    // executeAll<K extends keyof State, Target>(commands: FocusedCommand<State, Target>[])

    // TODO runtime check : either 'at' or 'focusWith', either 'updateState' or 'update'
    // executeFromBuilder<K extends keyof State, Target, L extends Lens<State, Target>>(builder: (State) =>
    //     FocusedCommand<State, Target, L> | FocusedCommand<State, Target, L>[])

    // TODO handle command builder use case (state branch state required for building commands for another branch)

}

export function createRootStore<RootState extends object>(initialState: RootState): Store<RootState> {
    return {} as any
}