import {UpdateSpec} from './update'
import {Observable} from 'rxjs/Observable'

export interface Store<State> {

    readonly currentState: State

    readonly state$: Observable<State>

    map<SubState>(project: (state: State) => SubState): Observable<SubState>

    select<K extends keyof State>(key: K): Observable<State[K]>

    focus<SubState>(project: (state: State) => SubState): Store<SubState>

    focusOn<K extends keyof State>(key: K): Store<State[K]>

    update(specBuilder: (state: State) => Partial<UpdateSpec<State>>)

    updateState(spec: Partial<UpdateSpec<State>>)

}

export function createRootStore<RootState extends object>(initialState: RootState): Store<RootState> {
    return {} as any
}