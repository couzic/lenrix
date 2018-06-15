import { map } from 'rxjs/operators'

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

const store = createStore(state)
const computedStore = store.compute(({ counter }) => ({
   isCounterPositive: counter >= 0
}))

// Computing from computed value not selected in focused selection @shouldNotCompile
computedStore.computeFrom$(
   _ => ({
      computedValue: _.focusPath('isCounterPositive')
   }),
   fields$ =>
      fields$.pipe(
         map(({ isCounterPositive }) => ({ whatever: isCounterPositive }))
      )
)

// Computing with initial values from computed value not selected in focused selection @shouldNotCompile
computedStore.computeFrom$(
   _ => ({
      computedValue: _.focusPath('isCounterPositive')
   }),
   fields$ =>
      fields$.pipe(
         map(({ isCounterPositive }) => ({ whatever: isCounterPositive }))
      ),
   { whatever: false }
)
