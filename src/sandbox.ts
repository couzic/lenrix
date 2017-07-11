import {add} from 'ramda'
import {Observable} from 'rxjs'
import {createRootStore, Store} from './Store'

export type State = {
    counter: number
    todo: {
        input: string
        list: string[]
    }
}

const initialState: State = {
    counter: 0,
    todo: {
        input: '',
        list: []
    }
}

export const store: Store<State> = createRootStore(initialState)
const counterStore = store.focusOn('counter')
const counterLens = store.lens.focusOn('counter')
const todoStore = store.focusOn('todo')

const store1 = store.focusOn('counter')
const store2 = store.focusWith(counterLens)
const store3 = store.focusWith(counterStore.lens)

counterStore.setValue(42)
counterStore.update(counter => counter + 1)
counterStore.update(add(1))
counterStore.setValue(42)

todoStore.updateState({
    input: 'new value'
})
todoStore.execute(
    {focusOn: 'input', setValue: ''},
    {focusOn: 'list', setValue: []}
)

const lens1 = store.lens.focusOn('counter')
const lens2 = store.lens.focusWith(lens1)

store.focusOn('counter').update(add(1))
store.focusWith(lens1).update(add(1))
store.focusWith(lens2).update(add(1))

store.execute({focusOn: 'counter', setValue: 42})
store.execute({focusOn: 'counter', update: add(1)})

store.execute(
    {focusOn: 'counter', setValue: 42},
    {focusOn: 'counter', update: add(1)},
    {focusWith: counterLens, setValue: 42},
    {focusWith: counterLens, update: add(1)}
)

store.executeAll([
    {focusOn: 'counter', setValue: 42},
    {focusOn: 'counter', update: add(1)},
    {focusWith: counterLens, setValue: 42},
    {focusWith: counterLens, update: add(1)}
])

store.executeFromBuilder(state => ({focusOn: 'counter', updateState: state.counter + 1}))

store.executeFromBuilder(state => [
    {focusOn: 'counter', updateState: state.counter + 1},
    {focusOn: 'counter', update: add(1)},
    {focusWith: counterLens, updateState: state.counter + 1},
    {focusWith: counterLens, update: add(1)}
])

export const actions = {

    increment() {
        // All these are equivalent and type-safe
        store.updateState({counter: val => val + 1})
        store.updateState({counter: add(1)}) // Using Ramda's automatically curryied functions
        store.focusOn('counter').update(add(1))
        store.focusWith(counterLens).update(add(1))
    }

}

// Recommended ways (all equivalent and all type-safe)
const counter1$: Observable<number> = store.state$.map(state => state.counter)
const counter2$: Observable<number> = store.select('counter')
const counter3$: Observable<number> = store.pick('counter').map(({counter}) => counter)
const counter5$: Observable<number> = store.focusOn('counter').state$
const counter4$: Observable<number> = store.focusWith(counterLens).state$

// Alternative way (useful for testing)
// expect(store.currentState.counter).toEqual(0)
// actions.increment()
// expect(store.currentState.counter).toEqual(1)