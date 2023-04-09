import { Observable } from 'rxjs'

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
const todoStore = store.focusPath('todo')

const lens = store.localLens
const todoLens = lens.focusPath('todo')

// @ts-expect-error
store.cherryPick(_ => null)

// @ts-expect-error
store.cherryPick(_ => undefined)

// @ts-expect-error
store.cherryPick(_ => 42)

// @ts-expect-error
store.cherryPick(_ => 'counter')

// @ts-expect-error
store.cherryPick(_ => [])

// @ts-expect-error
const lensExtractedState$: Observable<{
   todoList: number[]
}> = store.cherryPick(_ => ({ todoList: todoLens.focusPath('list') }))

// @ts-expect-error
store.cherryPick(_ => ({ a: todoStore.localLens.focusPath('list') }))

// @ts-expect-error
store.cherryPick(_ => ({ a: 42 }))

// @ts-expect-error
store.cherryPick(_ => ({ a: 'counter' }))

// @ts-expect-error
store.cherryPick(_ => ({ a: {} }))

// @ts-expect-error
store.cherryPick(_ => ({ a: [] }))

// @ts-expect-error
store.cherryPick(_ => ({ a: (state: { counter: string }) => null }))

// @ts-expect-error
store.cherryPick(_ => ({ a: null }))

// @ts-expect-error
store.cherryPick(_ => ({ a: undefined }))

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Cherry-picking function @shouldNotButDoesCompile
store.cherryPick(_ => () => 'counter')
