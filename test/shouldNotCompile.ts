import { createStore } from '../src/createStore'
// @shouldNotCompile
import { Observable } from 'rxjs/Observable'
import { Store } from '../src/Store'

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
const counterLens = lens.focusOn('counter')
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

///////////
// READ //
/////////

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

// Extracting null @shouldNotCompile
store.extract(null)

// Extracting undefined @shouldNotCompile
store.extract(undefined)

// Extracting number @shouldNotCompile
store.extract(42)

// Extracting string @shouldNotCompile
store.extract('counter')

// Extracting array @shouldNotCompile
store.extract([])

// Extracting with null @shouldNotCompile
store.extract({ a: null })

// Extracting with undefined @shouldNotCompile
store.extract({ a: undefined })

// Extracting with number @shouldNotCompile
store.extract({ a: 42 })

// Extracting with string @shouldNotCompile
store.extract({ a: 'counter' })

// Extracting with object @shouldNotCompile
store.extract({ a: {} })

// Extracting with array @shouldNotCompile
store.extract({ a: [] })

// Extracting with wrong input type selector @shouldNotCompile
store.extract({ a: (state: { counter: string }) => null })

// Assigning extract to wrong lens-extracted variable type @shouldNotCompile
const lensExtractedState$: Observable<{ todoList: number[] }> = store.extract({ todoList: todoLens.focusOn('list') })

// Extracting with wrong lens source type @shouldNotCompile
store.extract({ a: todoStore.lens.focusOn('list') })

/////////////
// UPDATE //
///////////

// Setting wrong value type @shouldNotCompile
counterStore.setValue('42')

// Updating with wrong input type update @shouldNotCompile
counterStore.update((counter: string) => 42)

// Updating with wrong output type update @shouldNotCompile
counterStore.update((counter: number) => '42')

// Setting unknown fields values @shouldNotCompile
store.setFieldValues({ unknown: 'unknown' })

// Updating unknown fields @shouldNotCompile
store.updateFields({ unknown: {} as any })

// Setting field values with wrong type @shouldNotCompile
store.setFieldValues({ counter: '42' })

// Updating fields with wrong field type @shouldNotCompile
store.updateFields({ counter: () => '42' })

// Piping wrong input type update @shouldNotCompile
counterStore.pipe((counter: string) => 42)

// Piping wrong output type update @shouldNotCompile
counterStore.pipe((counter: number) => '42')

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Extracting function @shouldNotButDoesCompile
store.extract(() => 'counter')

// Recomposing function @shouldNotButDoesCompile
store.recompose(() => null) // TODO Implement runtime check
