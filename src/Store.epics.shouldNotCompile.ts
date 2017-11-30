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

store.epics({
   doSomething: (payload$) => payload$.mapTo({ doSomethingElse: 42 })
})

store.epics({
   doSomething: (payload$) => payload$.mapTo({ type: 'doSomethingElse' as 'doSomethingElse', payload: 42 })
})

store.epics({
   doSomething: (payload$) => payload$.mapTo({ doNothing: undefined })
})

store.epics({
   doSomething: (payload$) => payload$.mapTo({ type: 'doNothing' as 'doNothing', payload: undefined })
})

// @shouldNotButDoesCompile
store.epics({
   doSomething: (payload$) => payload$.mapTo({ doSomething: undefined })
})
