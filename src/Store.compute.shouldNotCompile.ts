import { createStore } from './createStore'

type State = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const state = {} as State

const store = createStore(state)
const counterStore = store.focusPath('counter')
const todoStore = store.focusPath('todo')
const todoListStore = todoStore.focusPath('list')

const lens = store.localLens
const todoLens = lens.focusPath('todo')

//////////////
// COMPUTE //
////////////

// Calling compute() @compiles
store.compute(state => ({
   todoListLength: state.todo.list.length
}))

// Computing values with array @shouldNotCompile
store.compute(state => [state.todo.list.length])

// Computing values on primitive-focused store @shouldNotCompile
store
   .focusPath('counter')
   .compute((state: any) => ({ nothing: 'nothing' }))

// Computing values on array-focused store @shouldNotCompile
store
   .focusPath('todo', 'list')
   .compute((state: any) => ({ nothing: 'nothing' }))

// Assigning computed store with wrong ComputeValues type @shouldNotCompile
const computedWithWrongType: ComputedStore<State, { todoListLength: 0 }> = store.compute(state => ({
   todoListLength: state.todo.list.length
}))

// Assigning non-initialized value to safe pointer @shouldNotCompile
const computedWithoutInitialValues: number = store.compute$(state$ => state$.map(state => ({
   nonInitialized: 42
}))).currentState.nonInitialized

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Computing values with higher order function @shouldNotButDoesCompile
store.compute(state => () => null)
