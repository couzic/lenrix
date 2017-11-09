import { ComputedStore } from './ComputedStore';
import { createStore } from './createStore';

type State = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const initialState = {} as State
const store = createStore(initialState).compute(state => ({
   todoListLength: state.todo.list.length
}))

//////////////
// COMPUTE //
////////////

store.compute(state => ({
   todoListLength: state.todo.list.length
}))

// Computing values with array @shouldNotCompile
store.compute(state => [state.todo.list.length])

// Assigning computed store with wrong ComputeValues type @shouldNotCompile
const computedWithWrongType: ComputedStore<State, { doubleCounter: 0 }> = store.compute(state => ({
   doubleCounter: state.counter * 2
}))
