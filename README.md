# lenrix

#### Type-safe, reactive, focusable redux stores

> Redux + RxJS + TypeScript + Functional Lenses = ❤️ 

## Motivation

A lot of people have complained about `redux`, some with good reason. Many have been drawn to other state management solutions.

> Don't throw the baby with the bathwater.

Although we agree there must be a better way than classical `redux`, we are not willing to sacrifice all of the `redux` goodness you've heard so much about.

> Making redux great again !

`lenrix` is a `redux` store wrapper that :
 - Dramatically reduces boilerplate
 - Eliminates the need for thunky middleware and selector libraries
 - Makes no compromise on type safety
 - Embraces reactive programming
 - Prevents unnecessary re-rendering

## Features

 - Declarative API for deep state manipulation, powered by [`immutable-lens`](https://github.com/couzic/immutable-lens)
 - Reactive state and selectors, powered by [`rxjs`](https://github.com/reactivex/rxjs)
 - Epics (just like [`redux-observable`](https://github.com/redux-observable/redux-observable))

`lenrix` stores a single state tree, just like `redux`, but provides a way to create multiple representations of that managed state, each focused on a precise subset. See the [Focus](#focus) section for more details.

## Quickstart

### Install
```sh
$ npm i -S lenrix redux rxjs immutable-lens
```

### rootStore.ts
```ts
import { createStore } from 'lenrix'

const initialRootState = {message: ''}

export type RootState = typeof initialRootState

export const rootStore = createStore(initialRootState)
      // DECLARE ACTION AND PAYLOAD TYPES
      .actionTypes<{
         setMessage: string
      }>()
      // REGISTER STATE UPDATERS (~=CURRIED REDUCERS)
      .updates({
         setMessage: (message) => (state) => ({...state, message})
      }))
```

### storeConsumer.ts
```ts
import { rootStore } from './rootStore'

const message$ = rootStore.pluck('message') // Observable<string> 
const slice$ = rootStore.pick('message') // Observable<{message: string}>

rootStore.dispatch({setMessage: 'Hello !!!'})
```

## API

### Create

#### `createStore()`
```ts
import {createStore} from 'lenrix'

const rootStore = createStore({
   user: {
      id: 123,
      name: 'John Doe'
   }
})
```

#### `createFocusableStore()`
Provides the same API as `createStore()` from `redux`.
```ts
import {createFocusableStore} from 'lenrix'

const initialRootState = { ... }

export type RootState = typeof initialRootState

export const store = createFocusableStore(
   (state: RootState) => state, // You can use your old redux reducer here
   initialRootState,
   (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()
)
```

### Focus

Most UI components only interact with a small part of the whole state tree. A focused store provides read and update access to a precise subset of the full state, specifically tailored for a component or group of components.

All focus operations return a full-fledged store. Remember that a focused store is just a proxy for the root store, there always is a single source of truth.

#### `focusPath()`
```ts
const rootStore = createStore({
   user: {
      id: 123,
      name: 'John Doe'
   }
})

const userStore = rootStore.focusPath('user')
const userNameStore = userStore.focusPath('name')
// OR
const userNameStore = rootStore.focusPath('user', 'name') 
```

#### `focusFields()`
```ts
const rootStore = createStore({
   counter: 0,
   username: 'Bob'
})

const slice = rootStore.focusFields('counter').state$ // Observable<{counter: number}> 
```

#### `recompose()`
Most powerful focus operator. It allows you to create state representations composed of deep properties from distinct state subtrees. See [`immutable-lens`](https://github.com/couzic/immutable-lens) for the lens API documentation.
```ts
const rootStore = createStore({
   counter: 0,
   user: {
      name: 'Bob'
   }
})

const recomposedState = rootStore
   .recompose(lens => ({ // immutable-lens
      counter: lens.focusPath('counter'),
      userName: lens.focusPath('user', 'name')
   }))
   .state$ // Observable<{ counter: number, userName: string }>
```

### Consuming the state

It is recommended to always use one of these three methods when consuming the state. They will perform the relevant reference equality checks to prevent any unnecessary re-rendering.

#### `pluck()`
Conceptually equivalent to `focusPath().state$`
```ts
const rootStore = createStore({
   user: {
      name: 'Bob'
   }
})

const userName$ = rootStore.pluck('user', 'name') // Observable<string> 
```

#### `pick()`
Conceptually equivalent to `focusFields().state$`
```ts
const rootStore = createStore({
   counter: 0,
   user: 'Bob',
   todoList: ['Write README']
})

const pick$ = rootStore.pick(
   'user',
   'todoList'
) // Observable<{ user: string, todoList: string[] }>
```

#### `cherryPick()`
Conceptually equivalent to `recompose().state$`. See [`immutable-lens`](https://github.com/couzic/immutable-lens) for the lens API documentation.
```ts
const rootStore = createStore({
   counter: 0,
   user: {
      name: 'Bob'
   }
})

const cherryPick$ = rootStore.cherryPick(lens => ({ // immutable-lens
   counter: lens.focusPath('counter'),
   userName: lens.focusPath('user', 'name')
})) // Observable<{ counter: number, userName: string }>
```

### Actions and Updates

#### `actionTypes()`
Declare the store's actions and associated payload types. Calling this method will have absolutely no runtime effect, all it does is provide information to the TypeScript compiler.
```ts
const store = createStore({name: 'Bob'})
   .actionTypes<{setName: string}>()
```

#### `updates()`
Once action types are defined, it is possible to register type-safe updates. See [`immutable-lens`](https://github.com/couzic/immutable-lens) for the lens API documentation.
```ts
const store = createStore({name: 'Bob'})
   .actionTypes<{setName: string}>()
   // THESE FOUR CALLS TO updates() ARE ALL EQUIVALENT AND 100% TYPE SAFE
   // PICK THE ONE YOU PREFER
   .updates({
      setMessage: (message) => (state) => ({...state, message})
   })
   .updates(lens => ({
      setMessage: (message) => lens.setFields({message})
   }))
   .updates(lens => ({
      setMessage: (message) => lens.focusPath('message').setValue(message)
   }))
   // And if you like curry...
   .updates(lens => ({
      setMessage: lens.focusPath('message').setValue()
   }))
```

#### `dispatch()`
Dispatching an action can trigger a registered update.
```ts
store.dispatch({setName: 'John'}) // Next state will be {name: 'John'}
```

## Computed values
State should be normalized, derived data should be stored as computed values. In traditional redux, you would use selectors to compute values.

`lenrix` performs the most relevant reference equality checks to prevent unnecessary recomputation.

### Synchronously computed values

#### `compute()`
```ts
createStore({name: 'Bob'})
   .compute(state => ({greeting: 'Hello, ' + state.name}))
   .pick('greeting') // Observable<{greeting: string}>
```
#### `computeFromFields()`
Specify the fields used for the computation in order to avoid useless re-computations.
```ts
createStore({name: 'Bob', irrelevant: 'whatever'})
   .computeFromFields(
      ['name'],
      ({name}) => ({greeting: 'Hello, ' + name})
   )
   .pick('greeting') // Observable<{greeting: string}>
```
#### `computeFrom()`
Define computed values from state slices focused by lenses. The signature is similar to `recompose()` and `cherryPick()`.
```ts
createStore({name: 'Bob', irrelevant: 'whatever'})
   .computeFrom(
      lens => ({name: lens.focusPath('name')}),
      ({name}) => ({greeting: 'Hello, ' + name}))
   .pick('greeting') // Observable<{greeting: string}>
```
### Asynchronously computed values
Every synchronous value-computing operator has an asynchronous equivalent. Note that asynchronously computed values are initially undefined. If you want them to be non-nullable, see the [`defaultValues()`](#`defaultValues()`) operator.

#### `compute$()`
```ts
import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'

createStore({name: 'Bob'})
   .compute$(
      switchMap(state => of({greeting: 'Hello, ' + state.name}))
   )
   .pick('greeting') // Observable<{greeting: string | undefined}>
```
#### `computeFromFields$()`
```ts
import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'

createStore({name: 'Bob', irrelevant: 'whatever'})
   .computeFromFields$(
      ['name'],
      switchMap(({name}) => of({greeting: 'Hello, ' + name}))
   )
   .pick('greeting') // Observable<{greeting: string | undefined}>
```
#### `computeFrom$()`
```ts
import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'

createStore({name: 'Bob', irrelevant: 'whatever'})
   .computeFrom$(
      lens => ({name: lens.focusPath('name')}),
      switchMap(({name}) => of({greeting: 'Hello, ' + name}))
   .pick('greeting') // Observable<{greeting: string | undefined}>
```

#### `defaultValues()`
Define default values for asynchronously computed values.
```ts
import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'

createStore({name: 'Bob'})
   .compute$(
      switchMap(state => of({greeting: 'Hello, ' + state.name}))
   )
   .defaultValues({
      greeting: ''
   })
   .pick('greeting') // Observable<{greeting: string}>
```

### Epics

#### `epics()`

### Side effects

#### `sideEffects()`
