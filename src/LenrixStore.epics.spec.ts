import 'rxjs/add/operator/mapTo'

import { expect } from 'chai'

import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
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
   counter: 0,
   todo: {
      input: '',
      list: [],
      count: 0
   }
}

interface Actions {
   buttonClicked: void
   incrementCounter: void
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
      store = createStore(initialState, {logger: silentLoggerOptions})
         .actionTypes<Actions>()
         .updates(_ => ({
            incrementCounter: () => _.updateFields({ counter: (val) => val + 1 }),
            setCounter: (counter) => _.setFieldValues({ counter }),
            setTodoCount: (todoCount) => _.focusPath('todo', 'count').setValue(todoCount)
         }))
         .epics({
            buttonClicked: ($) => $.mapTo({ incrementCounter: undefined })
         })
   })

   it('dispatches actions', () => {
      store.dispatch({ buttonClicked: undefined })
      expect(store.currentState.counter).to.equal(1)
   })

   it('dispatches actions for every dispatched epic', () => {
      store.dispatch({ buttonClicked: undefined })
      store.dispatch({ buttonClicked: undefined })
      expect(store.currentState.counter).to.equal(2)
   })

})
