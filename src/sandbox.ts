import { Observable } from 'rxjs'
import { FieldValues, Lens, Update } from 'immutable-lens'
import { Store } from './Store'
import { createStore } from './createStore'

const add = (i: number): Update<number> => (j: number) => i + j

type State = {
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

const store: Store<State> = createStore(initialState)
const counterStore = store.focusOn('counter')
const counterLens: Lens<State, number> = store.lens.focusOn('counter')
const todoStore = store.focusOn('todo')
const todoLens = store.lens.focusOn('todo')
const todoInputLens: Lens<State, string> = todoLens.focusOn('input')

todoStore.focusOn('list').focusIndex(74).setValue('TOTO')

const store1 = store.focusOn('counter')

counterStore.setValue(42)
counterStore.update(counter => counter + 1)
counterStore.update(add(1))
counterStore.setValue(42)

todoStore.setFieldValues({
   input: 'new value'
})

todoStore.setFieldValues({ input: '' })

const lens1 = store.lens.focusOn('counter')

store.focusOn('counter').update(add(1))

const spec: FieldValues<{ input: string }> = { input: '' }

const actions = {

   increment() {
      // All these are equivalent and type-safe
      store.updateFields({ counter: val => val + 1 })
      store.updateFields({ counter: add(1) }) // Using Ramda's automatically curryied functions
      store.focusOn('counter').update(add(1))
   }

}

// Recommended ways (all equivalent and all type-safe)
const counter1$: Observable<number> = store.state$.map(state => state.counter)
const counter2$: Observable<number> = store.select('counter')
const counter3$: Observable<number> = store.pick('counter').map(({ counter }) => counter)
const counter5$: Observable<number> = store.focusOn('counter').state$

// Alternative way (useful for testing)
// expect(store.currentState.counter).toEqual(0)
// actions.increment()
// expect(store.currentState.counter).toEqual(1)
