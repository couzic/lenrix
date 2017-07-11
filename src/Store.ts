import {FocusedUpdateCommand, UpdateSpec, ValueUpdater} from './update'
import {Observable} from 'rxjs/Observable'
import {Lens, UnfocusedLens} from './Lens'

export interface Store<State> {

    readonly currentState: State

    // TODO: .distinctUntilChange()
    readonly state$: Observable<State>

    readonly lens: UnfocusedLens<State>

    select<K extends keyof State>(key: K): Observable<State[K]>

    pick<K extends keyof State>(...keys: K[]): Observable<Pick<State, K>>

    focusOn<K extends keyof State>(key: K): Store<State[K]>

    focusWith<Target>(lens: Lens<State, Target>): Store<Target>

    setValue(newValue: State)

    update(updater: ValueUpdater<State>)

    // TODO runtime check : Not a function
    updateState(spec: UpdateSpec<State>)

    // TODO runtime check : either 'at' or 'focusWith', either 'updateState' or 'update'
    execute<K extends keyof State, Target, L extends Lens<State, Target>>(...commands: FocusedUpdateCommand<State, K, Target, L>[])

    // TODO runtime check : either 'at' or 'focusWith', either 'updateState' or 'update'
    executeAll<K extends keyof State, Target, L extends Lens<State, Target>>(commands: FocusedUpdateCommand<State, K, Target, L>[])

    // TODO runtime check : either 'at' or 'focusWith', either 'updateState' or 'update'
    executeFromBuilder<K extends keyof State, Target, L extends Lens<State, Target>>(builder: (State) =>
        FocusedUpdateCommand<State, K, Target, L> | FocusedUpdateCommand<State, K, Target, L>[])

}

export function createRootStore<RootState extends object>(initialState: RootState): Store<RootState> {
    return {} as any
}