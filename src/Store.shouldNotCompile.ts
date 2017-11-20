import { ComputedStore } from './ComputedStore'
import { createStore } from './createStore'
import { Store } from './Store'

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

const lens = store.lens
const todoLens = lens.focusPath('todo')

// Mutating state$ @shouldNotCompile
store.state$ = store.state$

// Mutating lens @shouldNotCompile
store.lens = store.lens

////////////
// FOCUS //
//////////

// Focusing on null key @shouldNotCompile
store.focusPath(null)

// Focusing on undefined key @shouldNotCompile
store.focusPath(undefined)

// Focusing on non-string key @shouldNotCompile
store.focusPath(42)

// Focusing on object key @shouldNotCompile
store.focusPath({})

// Focusing on function key @shouldNotCompile
store.focusPath(() => 'counter')

// Focusing on unknown key @shouldNotCompile
store.focusPath('unknown')

// Focusing unknown field @shouldNotCompile
store.focusFields('unknown')

// Focusing fields on arrayFocusedStore @shouldNotCompile
todoListStore.focusFields('length')

// Focusing key on array-focused store @shouldNotCompile
todoListStore.focusPath('length')

// Focusing null index @shouldNotCompile
todoListStore.focusIndex(null)

// Focusing undefined index @shouldNotCompile
todoListStore.focusIndex(undefined)

// Focusing non-number index @shouldNotCompile
todoListStore.focusIndex('42')

// Focusing object index @shouldNotCompile
todoListStore.focusIndex({})

// Focusing index on primitive-focused store @shouldNotCompile
counterStore.focusIndex(4)

// Focusing index on object-focused store @shouldNotCompile
todoStore.focusIndex(4)

// Recomposing null @shouldNotCompile
store.recompose(null)

// Recomposing undefined @shouldNotCompile
store.recompose(undefined)

// Recomposing number @shouldNotCompile
store.recompose(42)

// Recomposing string @shouldNotCompile
store.recompose('counter')

// Recomposing array @shouldNotCompile
store.recompose([])

// Recomposing with wrong source type Lens @shouldNotCompile
store.recompose({ todoList: todoListStore.lens })

// Recomposing with wrong source type Lens @shouldNotCompile
const recomposedStore: Store<{ todoList: number[] }> = store.recompose({ todoList: todoLens.focusPath('list') })

//////////////
// COMPUTE //
////////////

// Calling compute() @compiles
store.compute(state => ({
   todoListLength: state.todo.list.length
}))

// Computing values with array @shouldNotCompile
store.compute(state => [state.todo.list.length])

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

// Updating field values with unknown prop @shouldNotButDoesCompile
store.updateFieldValues(state => ({
   unknown: 'unknown'
}))

// Recomposing function @shouldNotButDoesCompile
store.recompose(() => null) // TODO Implement runtime check

// Computing values with higher order function @shouldNotButDoesCompile
store.compute(state => () => null)
