import { of } from 'rxjs'
import { switchMapTo } from 'rxjs/operators'

import { createStore } from './createStore'
import { NullableKeys } from './util/NullableKeys'

type State = {
   counter: number | undefined
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const state: State = {} as any

const store = createStore(state).compute$(switchMapTo(of({ toto: 'tata' })))
const todoStore = store.focusPath('todo')
const todoListStore = todoStore.focusPath('list')

type S = (typeof store)['currentComputedState']
type Toto = NullableKeys<S>
store.computedState$
// Should make normalized state fields non-nullable
const count: number = store.rejectNilFields('toto').currentComputedState
//    .counter
// const count: number = store.rejectNilFields('counter').currentComputedState
//    .counter
// const count2: number | null | undefined = store.rejectNilFields('counter')
//    .currentComputedState.counter

// Should make computed values non-nullable
// const negativeCount: number = store
//    .compute(({ counter }) => ({ negativeCount: -counter }))
//    .rejectNilFields('negativeCount').currentComputedState.negativeCount

// Rejecting null key @shouldNotCompile
store.rejectNilFields(null)

// Rejecting undefined key @shouldNotCompile
store.rejectNilFields(undefined)

// Rejecting object key @shouldNotCompile
store.rejectNilFields({})

// Rejecting function key @shouldNotCompile
store.rejectNilFields(() => 'counter')

// Rejecting unknown key @shouldNotCompile
store.rejectNilFields('unknown')

// Rejecting non-nullable field @shouldNotCompile
store.rejectNilFields('todo')

// Rejecting keys on array-focused store @shouldNotCompile
todoListStore.rejectNilFields('length')
