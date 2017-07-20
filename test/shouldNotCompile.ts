/////////////
//  Lens  //
///////////

import {createLens} from '../src/Lens'
// @shouldNotCompile
import {createStore} from '../src/Store'

type Source = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const source = {} as Source

const lens = createLens<Source>()
const counterLens = lens.focusOn('counter')
const todoLens = lens.focusOn('todo')
const todoListLens = todoLens.focusOn('list')

const store = createStore(source)
const counterStore = store.focusOn('counter')
const todoStore = store.focusOn('todo')
const todoListStore = todoStore.focusOn('list')

// Focusing on null key @shouldNotCompile
lens.focusOn(null)

// Focusing on undefined key @shouldNotCompile
lens.focusOn(undefined)

// Focusing on non-string key @shouldNotCompile
lens.focusOn(42)

// Focusing on object key @shouldNotCompile
lens.focusOn({})

// Focusing on function key @shouldNotCompile
lens.focusOn(() => 'counter')

// Focusing on unknown key @shouldNotCompile
lens.focusOn('unknown')

// Focusing at null lens @shouldNotCompile
lens.focusAt(null)

// Focusing at undefined lens @shouldNotCompile
lens.focusAt(undefined)

// Focusing at non-lens object @shouldNotCompile
lens.focusAt({})

// Focusing at function @shouldNotCompile
lens.focusAt(() => 'counter')

// Focusing at primitive lens @shouldNotCompile
lens.focusAt(42)

// Focusing at parent lens @shouldNotCompile
todoLens.focusAt(lens)

// Focusing at sibling lens @shouldNotCompile
todoLens.focusAt(lens.focusOn('counter'))

// Focusing null index @shouldNotCompile
todoListLens.focusIndex(null)

// Focusing undefined index @shouldNotCompile
todoListLens.focusIndex(undefined)

// Focusing non-number index @shouldNotCompile
todoListLens.focusIndex('42')

// Focusing object index @shouldNotCompile
todoListLens.focusIndex({})

// Focusing index on primitive-focused lens @shouldNotCompile
counterLens.focusIndex(4)

// Focusing index on object-focused lens @shouldNotCompile
todoLens.focusIndex(4)

// Reading null source @shouldNotCompile
lens.read(null)

// Reading undefined source @shouldNotCompile
lens.read(undefined)

// Reading primitive source @shouldNotCompile
lens.read(42)

// Reading empty object source @shouldNotCompile
lens.read({})

// Reading wrong source with correct target @shouldNotCompile
counterLens.read({counter: 42})

// Reading child source @shouldNotCompile
lens.read(source.todo)

// Reading sibling source @shouldNotCompile
counterLens.read(source.todo)

// Setting value on null source @shouldNotCompile
counterLens.setValue(null, 42)

// Setting value on undefined source @shouldNotCompile
counterLens.setValue(undefined, 42)

// Setting value on primitive source @shouldNotCompile
counterLens.setValue(42, 42)

// Setting value on wrong type source @shouldNotCompile
counterLens.setValue({counter: 42}, 42)

// Setting null value with primitive-focused lens @shouldNotCompile
counterLens.setValue(source, null)

// Setting null value with object-focused lens @shouldNotCompile
todoLens.setValue(source, null)

// Setting undefined value with primitive-focused lens @shouldNotCompile
counterLens.setValue(source, undefined)

// Setting undefined value with object-focused lens @shouldNotCompile
todoLens.setValue(source, undefined)

// Setting wrong primitive type value with primitive-focused lens @shouldNotCompile
counterLens.setValue(source, '42')

// Setting object value with primitive-focused lens @shouldNotCompile
counterLens.setValue(source, {})

// Setting primitive value with object-focused lens @shouldNotCompile
todoLens.setValue(source, 42)

// Setting wrong type object value with object-focused lens @shouldNotCompile
todoLens.setValue(source, {count: 42})

// Setting function value with object-focused lens @shouldNotCompile
todoLens.setValue(source, () => source.todo)

// Updating null source @shouldNotCompile
counterLens.update(null, () => 42)

// Updating undefined source @shouldNotCompile
counterLens.update(undefined, () => 42)

// Updating on primitive source @shouldNotCompile
counterLens.update(42, () => 42)

// Updating on wrong type source @shouldNotCompile
counterLens.update({counter: 42}, () => 42)

// Updating with null updater @shouldNotCompile
counterLens.update(source, null)

// Updating with undefined updater @shouldNotCompile
counterLens.update(source, undefined)

// Updating with primitive updater @shouldNotCompile
counterLens.update(source, 42)

// Updating with object updater @shouldNotCompile
counterLens.update(source, {counter: 42})

// Updating with wrong input type updater @shouldNotCompile
counterLens.update(source, (counter: string) => 42)

// Updating with wrong output type updater @shouldNotCompile
counterLens.update(source, (counter: number) => '42')

// Updating object with wrong output type updater @shouldNotCompile
todoLens.update(source, (todo) => 'todo')

// Updating fields with primitive-focused lens @shouldNotCompile
counterLens.updateFields(source, {})

// Updating null fields @shouldNotCompile
todoLens.updateFields(source, null)

// Updating undefined fields @shouldNotCompile
todoLens.updateFields(source, undefined)

// Updating unknown fields @shouldNotCompile
todoLens.updateFields(source, {unknown: ''})

// Updating primitive field with wrong type @shouldNotCompile
todoLens.updateFields(source, {input: 42})

// Updating primitive field with wrong input type updater @shouldNotCompile
todoLens.updateFields(source, {input: (v: number) => ''})

// Updating primitive field with wrong output type updater @shouldNotCompile
todoLens.updateFields(source, {input: (v: string) => 42})

// Updating object field with wrong type @shouldNotCompile
lens.updateFields(source, {todo: {}})

// Updating object field with wrong input type updater @shouldNotCompile
lens.updateFields(source, {todo: (value: { input: number }) => source.todo})

// Updating object field with wrong output type updater @shouldNotCompile
lens.updateFields(source, {todo: (value) => ({})})

//////////////
//  Store  //
////////////

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
todoStore.commands.setValueAt(lens, source.todo)

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

// Executing empty object command @shouldNotCompile
store.execute({})

// Executing unfocused multi command @shouldNotCompile
store.execute({update: v => v, setValue: store.currentState})
















