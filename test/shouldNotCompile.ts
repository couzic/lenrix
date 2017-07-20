import {createStore} from '../src/Store'

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

// Mutating currentState @shouldNotCompile
store.currentState = store.currentState

// Mutating state$ @shouldNotCompile
store.state$ = store.state$

// Mutating lens @shouldNotCompile
store.lens = store.lens

// Mutating commands @shouldNotCompile
store.commands = store.commands

// Building setValue command with null value @shouldNotCompile
store.commands.setValue(null)

// Building setValue command with undefined value @shouldNotCompile
store.commands.setValue(undefined)

// Building setValue command with wrong type @shouldNotCompile
store.commands.setValue({})

// Building setValue command at null lens @shouldNotCompile
store.commands.setValueAt(null, store.currentState)

// Building setValue command at undefined lens @shouldNotCompile
store.commands.setValueAt(undefined, store.currentState)

// Building setValue command at parent lens @shouldNotCompile
todoStore.commands.setValueAt(lens, state.todo)

// Building setValue command at sibling lens @shouldNotCompile
todoStore.commands.setValueAt(counterLens, 42)

// Building update command with object updater @shouldNotCompile
counterStore.commands.update({})

// Building update command with wrong input type updater @shouldNotCompile
counterStore.commands.update((counter: string) => 42)

// Building update command with wrong output type updater @shouldNotCompile
counterStore.commands.update((counter) => '42')

// Building updateFields command with unknown field @shouldNotCompile
store.commands.updateFields({unknown: 'unknown'})

// Building updateFields command with wrong field type @shouldNotCompile
store.commands.updateFields({counter: '42'})

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

// Focusing at null lens @shouldNotCompile
store.focusAt(null)

// Focusing at undefined lens @shouldNotCompile
store.focusAt(undefined)

// Focusing at non-lens object @shouldNotCompile
store.focusAt({})

// Focusing at function @shouldNotCompile
store.focusAt(() => 'counter')

// Focusing at primitive lens @shouldNotCompile
store.focusAt(42)

// Focusing at parent lens @shouldNotCompile
todoStore.focusAt(lens)

// Focusing at sibling lens @shouldNotCompile
todoStore.focusAt(counterLens)

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

// Setting wrong value type @shouldNotCompile
counterStore.setValue('42')

// Updating with wrong input type updater @shouldNotCompile
counterStore.update((counter: string) => 42)

// Updating with wrong output type updater @shouldNotCompile
counterStore.update((counter: number) => '42')

// Updating fields with unknown field @shouldNotCompile
store.updateFields({unknown: 'unknown'})

// Updating fields with wrong field type @shouldNotCompile
store.updateFields({counter: '42'})

// Executing null command @shouldNotCompile
store.execute(null)

// Executing undefined command @shouldNotCompile
store.execute(undefined)

// Executing primitive command @shouldNotCompile
store.execute(42)

// Executing object missing command @shouldNotCompile
store.execute({at: store.lens})

// Executing object missing focus @shouldNotCompile
store.execute({at: store.lens})

// Executing setValue command with wrong type @shouldNotCompile
store.execute({at: store.lens, setValue: 44})
















