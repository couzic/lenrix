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

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Registering update with unknown action @shouldNotButDoesCompile
store.updates(_ => ({
   doString: s => _.focusPath('counter').setValue(42),
   unknown: (s: any) => _.focusPath('counter').setValue(42)
}))
