import {add} from 'ramda'
import {Observable} from 'rxjs'
import {createRootStore, Store} from './Store'
import {FieldsUpdater, Lens} from './Lens'

export type State = {
    counter: number
    todo: {
        input: string
        list: string[]
        count: number
    }
}

const initialState: State = {
    counter: 0,
    todo: {
        input: '',
        list: [],
        count: 0
    }
}

export const store: Store<State> = createRootStore(initialState)
const counterStore = store.focusOn('counter')
const counterLens: Lens<State, number> = store.lens.focusOn('counter')
const todoStore = store.focusOn('todo')
const todoLens = store.lens.focusOn('todo')
const todoInputLens: Lens<State, string> = todoLens.focusOn('input')

store.execute({setValue: initialState})
store.execute({at: counterLens, setValue: 11})
store.execute({update: (state) => state})
store.execute({at: counterLens, update: add(1)})
// store.execute({updateFields: {counter: add(1)}})
// store.execute({at: todoLens, updateFields: {count: add(1)}})
// @shouldNotCompile
// store.execute(store.commands.updateFieldsAt(todoLens, {toto: 44}))
store.execute(store.commands.updateFieldsAt(todoLens, {count: 47}))
store.execute(store.commands.setValueOn('counter', 11))
store.execute(store.commands.setValueAt(counterLens, 11))
// @shouldNotCompile
// store.execute({at: counterLens, setValue: '11'})
store.execute({at: counterLens, update: () => 11})
// @shouldNotCompile
// store.execute({at: counterLens, update: () => '11'})
// store.execute({at: todoLens, updateFields: {input: 'whatever'}})

store.execute(
    {at: counterLens, setValue: 11},
    {at: todoInputLens, setValue: ''}
)

const store1 = store.focusOn('counter')
const store2 = store.focusAt(counterLens)

counterStore.setValue(42)
counterStore.update(counter => counter + 1)
counterStore.update(add(1))
counterStore.setValue(42)

todoStore.updateFields({
    input: 'new value'
})
// todoStore.execute(
//     {at: todoLens.focusOn('input'), setValue: () => 's'},
//     {at: todoLens.focusOn('list'), setValue: []}
// )

todoStore.updateFields({input: ''})

const lens1 = store.lens.focusOn('counter')
const lens2 = store.lens.focusAt(lens1)

store.focusOn('counter').update(add(1))
store.focusAt(lens1).update(add(1))
store.focusAt(lens2).update(add(1))

const spec: FieldsUpdater<{ input: string }> = {input: ''}
// const command: StateCommand<{ input: string }> = {updateFields: {input: '', sisjsjisj: 44}} // TODO file TypeScript bug ?

// @shouldNotCompile
// store.execute({at: counterLens, setValue: 42, toto: 42})
store.execute({at: counterLens, update: add(1)})

// @shouldNotCompile
// store.focusOn('todo').updateFields({input: '', toto: 42, list: [], count: 0})
// store.execute(store.commands.updateFields({counter: add(1), toto: 42}))
// store.execute(store.commands.updateFieldsOn('todo', {input: '', toto: 42, list: [], count: 0}))
// store.execute(store.commands.updateFieldsAt(todoLens, {input: '', toto: 42, list: [], count: 0}))

// @shouldNotCompile
// store.execute({at: todoLens, updateFields: {input: '', toto: 42, list: [], count: 0}})
//
// store.execute(
//     {focusOn: 'counter', command: {setValue: 42}},
//     {focusOn: 'counter', command: {update: add(1)}},
//     {focusWith: counterLens, command: {setValue: 42}},
//     {focusWith: counterLens, command: {update: add(1)}}
// )
//
// store.executeAll([
//     {focusOn: 'counter', command: {setValue: 42}},
//     {focusOn: 'counter', command: {update: add(1)}},
//     {focusWith: counterLens, command: {setValue: 42}},
//     {focusWith: counterLens, command: {update: add(1)}}
// ])
//
// store.executeFromBuilder(state => ({
//     focusOn: 'counter',
//     command: {updateState: state.counter + 1}
// }))
//
// store.executeFromBuilder(state => [
//     {focusOn: 'counter', command: {setValue: state.counter + 1}},
//     {focusOn: 'counter', command: {update: add(1)}},
//     {focusWith: counterLens, command: {setValue: state.counter + 1}},
//     {focusWith: counterLens, command: {update: add(1)}}
// ])

export const actions = {

    increment() {
        // All these are equivalent and type-safe
        store.updateFields({counter: val => val + 1})
        store.updateFields({counter: add(1)}) // Using Ramda's automatically curryied functions
        store.focusOn('counter').update(add(1))
        store.focusAt(counterLens).update(add(1))
    }

}

// Recommended ways (all equivalent and all type-safe)
const counter1$: Observable<number> = store.state$.map(state => state.counter)
const counter2$: Observable<number> = store.select('counter')
const counter3$: Observable<number> = store.pick('counter').map(({counter}) => counter)
const counter5$: Observable<number> = store.focusOn('counter').state$
const counter4$: Observable<number> = store.focusAt(counterLens).state$

// Alternative way (useful for testing)
// expect(store.currentState.counter).toEqual(0)
// actions.increment()
// expect(store.currentState.counter).toEqual(1)