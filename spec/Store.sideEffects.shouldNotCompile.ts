import { createStore } from '../src/createStore'

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

store.sideEffects({
   // @ts-expect-error
   unknown: () => console.log('shouldNotCompile')
})

store.sideEffects({
   // @ts-expect-error
   doString: (s: number) => console.log('shouldNotCompile')
})
