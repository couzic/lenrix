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

const state: State = {} as any

interface Actions {
   doString: string
   doNumber: number
}

const store = createStore(state).actionTypes<Actions>()

// Dispatching empty object @shouldNotCompile
store.dispatch({})

// Dispatching unknown action type @shouldNotCompile
store.dispatch({ doUnknown: 5 })

// Dispatching wrong payload type @shouldNotCompile
store.dispatch({ doString: 5 })

// Dispatching additional unknown payload type @shouldNotCompile
store.dispatch({ doString: '', unknown: '' })

// Dispatching null payload @shouldNotCompile
store.dispatch({ doString: null })

// Dispatching undefined payload @shouldNotCompile
store.dispatch({ doString: undefined })

// Dispatching action declared with different payload type @shouldNotCompile
store
   .actionTypes<{
      doString: number
   }>()
   .dispatch({ doString: 42 })

// Calling dispatcher without param @shouldNotCompile
store.action('doString')()

// Calling dispatcher with wrong optional param @shouldNotCompile
store.action('doOptionalString')(undefined)

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Dispatching two types in same object @shouldNotButDoesCompile
store.dispatch({ doString: '', doNumber: 5 })
