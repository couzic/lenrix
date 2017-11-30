import 'rxjs/add/operator/mapTo'

import { expect } from 'chai'

import { createStore } from './createStore'
import { Store } from './Store'

type State = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const initialState: State = {
   counter: 42,
   todo: {
      input: '',
      list: [],
      count: 42
   }
}

interface Actions {
   resetCounter: void
   setCounter: number
   setTodoCount: number
}

describe('LenrixStore.epics()', () => {
   let store: Store<{
      state: State
      computedValues: {}
      actions: Actions
      dependencies: {}
   }>

   beforeEach(() => {
      store = createStore(initialState)
         .actionTypes<Actions>()
         .actionHandlers(_ => ({
            setCounter: (counter) => _.setFieldValues({ counter }),
            setTodoCount: (todoCount) => _.focusPath('todo', 'count').setValue(todoCount)
         }))
         .epics({
            resetCounter: ($) => $.mapTo({ setCounter: 0 })
         })
   })

   xit('dispatches actions', () => {
      store.dispatch({ resetCounter: undefined })
      expect(store.currentState.counter).to.be.empty
   })

})
