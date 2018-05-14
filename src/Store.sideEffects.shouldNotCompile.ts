import { createStore } from './createStore'

type State = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const state: State = {} as any

interface Actions {
   doString: string
   doNumber: number
   doNull: null
   doVoid: void
   doUndefined: undefined
   doOptionalString: string | undefined
}

const store = createStore(state).actionTypes<Actions>()

// Registering side effect for unknown action @shouldNotCompile
store.sideEffects({
   unknown: () => console.log('shouldNotCompile'),
})

// Registering side effect with wrong payload type @shouldNotCompile
store.sideEffects({
   doString: (s: number) => console.log('shouldNotCompile'),
})
