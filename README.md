# lenrix

#### Type-safe, reactive, focusable redux stores

## Introduction
`lenrix` is a wrapper around a `redux` store, with a better API:
 - Less boilerplate
 - Designed for uncompromised type-safety
 - Declarative API for deep immutable updates
 - Reactive state and selectors, powered by `rxjs`
 - Epics (just like `redux-observable`)

`lenrix` stores a single state tree, just like `redux`, but provides a way to create multiple representations of that state, each focused on a precise subset. See the [Focus](#focus) section for more details.

## Quickstart

### Install
```sh
$ npm i -S lenrix immutable-lens redux rxjs
```

### Create a simple store
```ts
import { createStore } from 'lenrix'

export const store = createStore(initialState)
```

### Create a store with the redux API
```ts
import { createFocusableStore } from 'lenrix'

export const store = createFocusableStore(
   reducer, // legacy redux reducer
   preloadedState,
   reduxMiddleware // Redux devtools...
)
```

### Declare actions and updates
```ts
import { createStore } from 'lenrix'

export const store = createStore({message: ''})
   .actionTypes<{
      setMessage: string
   }>()
   // ALL THESE ARE EQUIVALENT AND 100% TYPE SAFE
   // PICK THE ONE YOU PREFER !!!
   .updates({
      setMessage: (message) => (state) => ({...state, message})
   })
   .updates(lens => ({
      setMessage: (message) => lens.setFields({message})
   }))
   .updates(lens => ({
      setMessage: (message) => lens.focusPath('message').setValue(message)
   }))
   // My personal favorite...
   .updates(lens => ({
      setMessage: lens.focusPath('message').setValue()
   }))
```

### Dispatch an action
```ts
store.dispatch({setMessage: 'Hello !!!'})
```

### Consume the state
```ts
import { store } from './store'

const message$: Observable<string> = store.pluck('message')
const pick$: Observable<{message: string}> = store.pick('message')
```

## API

### Create

#### `createStore()`
```ts
import {createStore} from 'lenrix'

type RootState = {
   user: {
      id:number
      name: string
   }
}

const initialRootState: State = {
   user: {
      id: 123,
      name: 'John Doe'
   }
}

const rootStore = createStore(initialState)
```

#### `createFocusableStore()`
```ts
import {createFocusableStore} from 'lenrix'

...

const rootStore = createFocusableStore(
   (state: RootState) => state, // You can use your old redux reducer here
   initialRootState,
   (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__())
```

### Focus

All focus operations return a full-fledged store. Note that a focused store is just a proxy for the root store, there always is a single source of truth.

#### `focusPath()`
```ts
const userStore = rootStore.focusPath('user')
const userNameStore = userStore.focusPath('name')
// OR
const userNameStore = rootStore.focusPath('user', 'name')
```

#### `focusFields()`
```ts
const initialState = {
   counter: 0,
   username: 'Bob'
}

const rootStore = createStore(initialState)

const slice: { counter: number } = rootStore.focusFields('counter').currentState
```

#### `recompose()`
```ts
const initialState = {
   counter: 0,
   user: {
      name: 'Bob'
   }
}

const rootStore = createStore(initialState)

const recomposedState: { 
   counter: number,
   userName: string
} = rootStore.recompose(lens => ({
   counter: lens.focusPath('counter'),
   userName: lens.focusPath('user', 'name')
})).currentState
```

### Consuming the state

It is recommended to always use one of these three methods when consuming the state. It is the only way to make sure that future additions to the store's state will not cause unnecessary computation or re-rendering.

#### `pluck()`
Functionnaly comparable to `focusPath().state$`
```ts
const initialState = {
   user: {
      name: 'Bob'
   }
}

const rootStore = createStore(initialState)

const userName$: Observable<string> = rootStore.pluck('user', 'name')
```

#### `pick()`
Functionnaly comparable to `focusFields().state$`
```ts
const initialState = {
   counter: 0,
   user: 'Bob',
   todoList: ['Write README']
}

const rootStore = createStore(initialState)

const pick$: Observable<{
   name: string,
   todoList: string[]
}> = rootStore.pick('user', 'todoList')
```

#### `cherryPick()`
Functionnaly comparable to `recompose().state$`
```ts
const initialState = {
   counter: 0,
   user: 'Bob',
   todoList: ['Write README']
}

const rootStore = createStore(initialState)

const pick$: Observable<{
   name: string,
   todoList: string[]
}> = rootStore.pick('user', 'todoList')
```

### Actions and Updates

#### `actionTypes()`
Declare the store's actions and associated payload types. Calling this method will have absolutely no runtime effect, it's only use is to provide type information.
```ts
const store = createStore({name: 'Bob'})
   .actionTypes<{setName: string}>()
```

#### `updates()`
Once action types are defined, it is possible to register updates
```ts
const store = createStore({name: 'Bob'})
   .actionTypes<{setName: string}>()
   .updates(lens => ({
      setName: lens.focusPath('name').setValue()
   }))
```

#### `dispatch()`
Dispatching an action can trigger a registered update
```ts
store.dispatch({setName: 'John'}) // Next state will be {name: 'John'}
```

### Syncronously computed values

#### `compute()`
#### `computeFrom()`
#### `computeFromFields()`

### Asyncronously computed values

#### `compute$()`
#### `computeFrom$()`
#### `computeFromFields$()`

### Epics

#### `epics()`

### Side effects

#### `sideEffects()`
