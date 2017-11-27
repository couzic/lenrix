import { TheStore } from './TheStore'

interface State {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const store = {} as TheStore<{
   state: State
   computedValues: {}
   actions: {}
   dependencies: {}
}>

const computingStore = store.compute(state => ({ whatever: 'whatever' }))

//////////////
// COMPUTE //
////////////

// Computing values on primitive-focused store @shouldNotCompile
store
   .focusPath('counter')
   .compute((state: any) => ({ nothing: 'nothing' }))

// Computing values on array-focused store @shouldNotCompile
store
   .focusPath('todo', 'list')
   .compute((state: any) => ({ nothing: 'nothing' }))

////////////
// FOCUS //
//////////

// Focusing path on primitive type while passing computed values @shouldNotCompile
computingStore.focusPath(['counter'], ['whatever'])

// Focusing path on array type while passing computed values @shouldNotCompile
computingStore.focusPath(['todo', 'list'], ['whatever'])
