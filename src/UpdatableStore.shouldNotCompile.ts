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
const counterStore = store.focusOn('counter')

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
