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
const computingStore = store.compute(state => ({ whatever: 'whatever' }))

const lens = store.localLens
const todoLens = lens.focusPath('todo')

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
const recomposedStore = store.recompose({ todoList: todoLens.focusPath('list') })

// Focusing path on primitive type while passing computed values @shouldNotCompile
computingStore.focusPath(['counter'], ['whatever'])

// Focusing path on array type while passing computed values @shouldNotCompile
computingStore.focusPath(['todo', 'list'], ['whatever'])
