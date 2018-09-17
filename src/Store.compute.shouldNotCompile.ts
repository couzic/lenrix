import { map } from 'rxjs/operators'

import { createStore } from './createStore'

type State = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const state: State = {} as any

const store = createStore(state)

// Calling compute() @compiles
store.compute(s => ({
   todoListLength: s.todo.list.length
}))

// Computing values on primitive-focused store @shouldNotCompile
store.focusPath('counter').compute((s: any) => ({ nothing: 'nothing' }))

// Computing values on array-focused store @shouldNotCompile
store.focusPath('todo', 'list').compute((s: any) => ({ nothing: 'nothing' }))

// Assigning non-initialized value to safe pointer @shouldNotCompile
const computedWithoutInitialValues: number = store.compute$(state$ =>
   state$.pipe(
      map(s => ({
         nonInitialized: 42
      }))
   )
).currentComputedState.nonInitialized

// Assigning computed value overring normalized state field to a variable of the original state's type @shouldNotCompile
const computedCounter: number = store.compute(({ counter }) => ({
   counter: String(counter)
})).currentComputedState.counter

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Computing values with array @shouldNotButDoesCompile
store.compute(s => [s.todo.list.length])

// Computing values with higher order function @shouldNotButDoesCompile
store.compute(s => () => null)
