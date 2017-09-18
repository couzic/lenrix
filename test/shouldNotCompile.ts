import { createStore } from '../src/createStore' // @shouldNotCompile for some obscure reason

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

///////////
// READ //
/////////

// Selecting null key @shouldNotCompile
store.select(null)

// Selecting undefined key @shouldNotCompile
store.select(undefined)

// Selecting non-string primitive key @shouldNotCompile
store.select(42)

// Selecting object key @shouldNotCompile
store.select({})

// Selecting function key @shouldNotCompile
store.select(() => 'counter')

// Selecting unknown key @shouldNotCompile
store.select('unknown')

// Selecting key on array-focused store @shouldNotCompile
todoListStore.select('length')

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
store.updateFields({ unknown: (v) => v })

// Setting field values with wrong type @shouldNotCompile
store.setFieldValues({ counter: '42' })

// Updating fields with wrong field type @shouldNotCompile
store.updateFields({ counter: () => '42' })

// Piping wrong input type update @shouldNotCompile
counterStore.pipe((counter: string) => 42)

// Piping wrong output type update @shouldNotCompile
counterStore.pipe((counter: number) => '42')











