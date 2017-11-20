import { createStore } from './createStore'
import { Observable } from 'rxjs/Observable'

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
const todoStore = store.focusPath('todo')
const todoListStore = todoStore.focusPath('list')

const lens = store.lens
const todoLens = lens.focusPath('todo')

// Plucking null key @shouldNotCompile
store.pluck(null)

// Plucking undefined key @shouldNotCompile
store.pluck(undefined)

// Plucking non-string primitive key @shouldNotCompile
store.pluck(42)

// Plucking object key @shouldNotCompile
store.pluck({})

// Plucking function key @shouldNotCompile
store.pluck(() => 'counter')

// Plucking unknown key @shouldNotCompile
store.pluck('unknown')

// Plucking key on array-focused store @shouldNotCompile
todoListStore.pluck('length')

// Picking null key @shouldNotCompile
store.pick(null)

// Picking undefined key @shouldNotCompile
store.pick(undefined)

// Picking object key @shouldNotCompile
store.pick({})

// Picking function key @shouldNotCompile
store.pick(() => 'counter')

// Picking unknown key @shouldNotCompile
store.pick('unknown')

// Picking keys on array-focused store @shouldNotCompile
todoListStore.pick('length')

// Cherry-picking with null @shouldNotCompile
store.cherryPick(null)

// Cherry-picking with undefined @shouldNotCompile
store.cherryPick(undefined)

// Cherry-picking with number @shouldNotCompile
store.cherryPick(42)

// Cherry-picking with string @shouldNotCompile
store.cherryPick('counter')

// Cherry-picking with array @shouldNotCompile
store.cherryPick([])

// Cherry-picking with null Lens @shouldNotCompile
store.cherryPick({ a: null })

// Cherry-picking with undefined Lens @shouldNotCompile
store.cherryPick({ a: undefined })

// Cherry-picking with number instead of Lens @shouldNotCompile
store.cherryPick({ a: 42 })

// Cherry-picking with string instead of Lens @shouldNotCompile
store.cherryPick({ a: 'counter' })

// Cherry-picking with object instead of Lens @shouldNotCompile
store.cherryPick({ a: {} })

// Cherry-picking with array instead of Lens @shouldNotCompile
store.cherryPick({ a: [] })

// Cherry-picking with wrong input type selector @shouldNotCompile
store.cherryPick({ a: (state: { counter: string }) => null })

// Assigning cherryPick to wrong lens-extracted variable type @shouldNotCompile
const lensExtractedState$: Observable<{ todoList: number[] }> = store.cherryPick({ todoList: todoLens.focusPath('list') })

// Cherry-picking with wrong lens source type @shouldNotCompile
store.cherryPick({ a: todoStore.lens.focusPath('list') })

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Cherry-picking function @shouldNotButDoesCompile
store.cherryPick(() => 'counter')
