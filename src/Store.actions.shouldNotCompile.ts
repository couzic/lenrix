import 'rxjs/add/operator/mapTo'

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

interface Actions {
   doSomething: string
   doSomethingElse: number
   doNothing: undefined
}

const store = createStore(state)
   .actionTypes<Actions>()

// @shouldNotCompile
store.dispatch({ type: 'doNothing' })

// store.dispatch('doNothing', undefined)

// @shouldNotCompile
store.dispatch('doSomething')
