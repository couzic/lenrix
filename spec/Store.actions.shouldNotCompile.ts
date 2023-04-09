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
   doOptionalString?: string
}

const store = createStore(state).actionTypes<Actions>()

// @ts-expect-error
store.dispatch({})

// @ts-expect-error
store.dispatch({ doUnknown: 5 })

// @ts-expect-error
store.dispatch({ doString: 5 })

// @ts-expect-error
store.dispatch({ doString: '', doUnknown: '' })

// @ts-expect-error
store.dispatch({ doString: null })

// @ts-expect-error
store.dispatch({ doString: undefined })

store
   .actionTypes<{
      doString: number
   }>()
   // @ts-expect-error
   .dispatch({ doString: 42 })

// @ts-expect-error
store.action('doString')()

// @ts-expect-error
store.action('doOptionalString')(42)
