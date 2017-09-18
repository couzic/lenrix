import { Store } from './Store'
import { RootStore } from './RootStore'

export function createStore<State extends object>(initialState: State): Store<State> {
   return new RootStore(initialState)
}
