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
const counterStore = store.focusOn('counter')
const todoStore = store.focusOn('todo')
const todoListStore = todoStore.focusOn('list')

const lens = store.lens
const todoLens = lens.focusOn('todo')

// Mutating state$ @shouldNotCompile
store.state$ = store.state$

// Mutating lens @shouldNotCompile
store.lens = store.lens

////////////
// FOCUS //
//////////

// Focusing on null key @shouldNotCompile
store.focusOn(null)

// Focusing on undefined key @shouldNotCompile
store.focusOn(undefined)

// Focusing on non-string key @shouldNotCompile
store.focusOn(42)

// Focusing on object key @shouldNotCompile
store.focusOn({})

// Focusing on function key @shouldNotCompile
store.focusOn(() => 'counter')

// Focusing on unknown key @shouldNotCompile
store.focusOn('unknown')

// Focusing unknown field @shouldNotCompile
store.focusFields('unknown')

// Focusing array of fields @shouldNotCompile
store.focusFields(['counter'])

// Focusing fields on arrayFocusedStore @shouldNotCompile
todoListStore.focusFields('length')

// Focusing key on array-focused store @shouldNotCompile
todoListStore.focusOn('length')

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
const recoomposedStore: Store<{ todoList: number[] }> = store.recompose({ todoList: todoLens.focusOn('list') })

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Recomposing function @shouldNotButDoesCompile
store.recompose(() => null) // TODO Implement runtime check
