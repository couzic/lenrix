import { map, pipe } from 'rxjs'

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

store.pureEpics({
   // @ts-expect-error
   doString: pipe(map(() => ({})))
})

store.pureEpics({
   // @ts-expect-error
   doString: pipe(
      map(() => ({
         doUnknown: undefined
      }))
   )
})

store.pureEpics({
   // @ts-expect-error
   doString: pipe(map(() => ({ doNumber: '42' })))
})

store.pureEpics({
   // @ts-expect-error
   doString: pipe(map(() => ({ doNumber: null })))
})

store.pureEpics({
   // @ts-expect-error
   doString: pipe(map(() => ({ doNumber: undefined })))
})

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Mapping with additional unknown payload type @shouldNotButDoesCompile
store.pureEpics({
   doString: pipe(map(() => ({ doNumber: 42, unknown: '' })))
})
