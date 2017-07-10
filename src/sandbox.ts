import {add} from 'ramda'
import {Observable} from 'rxjs'
import {createRootStore, Store} from './Store'
import {Lens} from './Lens'

export type State = {
    counter: number
}

const initialState: State = {
    counter: 0
}

export const store: Store<State> = createRootStore(initialState)

export const actions = {
    increment() {
        // All these are equivalent and type-safe
        store.update(state => ({counter: state.counter + 1}))
        store.updateState({counter: val => val + 1})
        store.updateState({counter: add(1)}) // Using Ramda's automatically curryied functions
        store.focus(state => state.counter).update(add(1))
        store.focusOn('counter').update(add(1))
    },

    incrementWithLens() {
        const counter: Lens<State, number> = {} as any
        store.updateAt(counter, add(1))
    }
}

// Recommended ways (all equivalent and all type-safe)
const counter1$: Observable<number> = store.state$.map(state => state.counter)
const counter2$: Observable<number> = store.map(state => state.counter)
const counter3$: Observable<number> = store.select('counter')
const counter4$: Observable<number> = store.focus(state => state.counter).state$
const counter5$: Observable<number> = store.focusOn('counter').state$

// Alternative way (useful for testing)
// expect(store.currentState.counter).toEqual(0)
// actions.increment()
// expect(store.currentState.counter).toEqual(1)