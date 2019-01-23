import { pipe } from 'rxjs'
import { map, mapTo } from 'rxjs/operators'

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

store.pureEpics({
   doNumber: map(n => ({ doString: String(n) }))
})

// Mapping to empty object @shouldNotCompile
store.pureEpics({
   doString: pipe(mapTo({}))
})

// Dispatching unknown action type @shouldNotCompile
store.pureEpics({
   doString: pipe(mapTo({ doUnknown: undefined }))
})

// Mapping to wrong payload type @shouldNotCompile
store.pureEpics({
   doString: pipe(mapTo({ doNumber: '42' }))
})

// Mapping to null payload @shouldNotCompile
store.pureEpics({
   doString: pipe(mapTo({ doNumber: null }))
})

// Mapping to undefined payload @shouldNotCompile
store.pureEpics({
   doString: pipe(mapTo({ doNumber: undefined }))
})

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Mapping with additional unknown payload type @shouldNotButDoesCompile
store.pureEpics({
   doString: pipe(mapTo({ doNumber: 42, unknown: '' }))
})

// Dispatching two types in same object @shouldNotButDoesCompile
store.pureEpics({
   doString: pipe(mapTo({ doString: '', doNumber: 5 }))
})
