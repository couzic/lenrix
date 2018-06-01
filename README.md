# lenrix

#### 🔎 + Redux + RxJS + TypeScript = ❤️ 

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
 - Epics, just like [`redux-observable`](https://github.com/redux-observable/redux-observable), our favorite redux middleware

`lenrix` stores a single state tree, just like `redux`, but provides a way to create multiple representations of that managed state, each focused on a precise subset. See the [Focus](#focus) section for more details.

## Quickstart

### Install
```sh
$ npm i -S lenrix redux rxjs immutable-lens
```

### rootStore.ts
```ts
import { createStore } from 'lenrix'

const initialRootState = {
   message: ''
}

export const rootStore = createStore(initialRootState)
      .actionTypes<{ // DECLARE ACTION AND PAYLOAD TYPES
         setMessage: string
      }>()
      .updates({ // REGISTER UPDATES (~= CURRIED REDUCERS)
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

### Actions and Updates

#### `actionTypes()`
Declare the store's actions and associated payload types. Calling this method will have absolutely no runtime effect, all it does is provide information to the TypeScript compiler.
```ts
const store = createStore({name: 'Bob'})
   .actionTypes<{
      setName: string
   }>()
```

#### `updates()`
Once action types are defined, it is possible to register type-safe updates. See [`immutable-lens`](https://github.com/couzic/immutable-lens) for `lens` API documentation.
```ts
const store = createStore({name: 'Bob'})
   .actionTypes<{setName: string}>()
   // THESE FOUR CALLS TO updates() ARE ALL EQUIVALENT AND 100% TYPE SAFE
   // PICK THE ONE YOU PREFER
   .updates({
      setName: (name) => (state) => ({...state, name})
   })
   .updates(lens => ({
      setName: (name) => lens.setFields({name})
   }))
   .updates(lens => ({
      setName: (name) => lens.focusPath('name').setValue(name)
   }))
   // And if you like double curry...
   .updates(lens => ({
      setName: lens.focusPath('name').setValue()
   }))
```

#### `dispatch()`
Dispatching an action can trigger an [update](#updates), an [epic](#epics), or a [side effect](#sideEffects).
```ts
store.dispatch({setName: 'John'}) // Next state will be : {name: 'John'}
```

### Consuming the state

The store provides the observable properties `state$` and `computedState$`.
However, it is recommended to always use one of the three following methods when consuming the state. They will perform reference equality checks to prevent any unnecessary re-rendering.

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
Conceptually equivalent to `recompose().state$`. See [`immutable-lens`](https://github.com/couzic/immutable-lens) for lens API documentation.
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
Most powerful focus operator. It allows you to create state representations composed of deep properties from distinct state subtrees. See [`immutable-lens`](https://github.com/couzic/immutable-lens) for lens API documentation.
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
Every synchronous value-computing operator has an asynchronous equivalent. Each of them accepts multiple RxJS operators, much like `Observable.pipe()`.

Note that asynchronously computed values are initially undefined. If you want them to be non-nullable, see [`defaultValues()`](#`defaultValues()`).

#### `compute$()`
```ts
import { map } from 'rxjs/operators'

createStore({name: 'Bob'})
   .compute$(
      map(state => ({greeting: 'Hello, ' + state.name}))
   )
   .pick('greeting') // Observable<{greeting: string | undefined}>
```
#### `computeFromFields$()`
```ts
import { map } from 'rxjs/operators'

createStore({name: 'Bob', irrelevant: 'whatever'})
   .computeFromFields$(
      ['name'],
      map(({name}) => ({greeting: 'Hello, ' + name}))
   )
   .pick('greeting') // Observable<{greeting: string | undefined}>
```
#### `computeFrom$()`
```ts
import { map } from 'rxjs/operators'

createStore({name: 'Bob', irrelevant: 'whatever'})
   .computeFrom$(
      lens => ({name: lens.focusPath('name')}),
      map(({name}) => ({greeting: 'Hello, ' + name}))
   .pick('greeting') // Observable<{greeting: string | undefined}>
```

#### `defaultValues()`
Define default values for asynchronously computed values.
```ts
import { map } from 'rxjs/operators'

createStore({name: 'Bob'})
   .compute$(
      map(({name}) => ({greeting: 'Hello, ' + name}))
   )
   .defaultValues({
      greeting: ''
   })
   .pick('greeting') // Observable<{greeting: string}>
```

### Epics

#### `epics()`

```ts
import { pipe } from 'rxjs'
import { map } from 'rxjs/operators'

createStore({name: '', greeting: ''})
   .actionTypes<{
      setName: string
      setGreeting: string
   }>()
   .updates(lens => ({
      setName: name => lens.setFields({name}),
      setGreeting: greeting => lens.setFields({greeting})
   }))
   .epics({
      // WITH SINGLE OPERATOR...
      setName: map(name => ({setGreeting: 'Hello, ' + name}))
      // ... OR WITH MULTIPLE OPERATORS
      setName: pipe(
         map(name => 'Hello, ' + name),
         map(greeting => ({setGreeting: greeting}))
      )
   })
```

##### Access to store 

```ts
import { mapTo } from 'rxjs/operators'

createStore({name: '', greeting: ''})
   .actionTypes<{
      setName: string
      setGreeting: string
   }>()
   .updates(lens => ({
      setName: name => lens.setFields({name}),
      setGreeting: greeting => lens.setFields({greeting})
   }))
   .epics({
      setName: (payload$, store) => payload$.pipe(
         mapTo({setGreeting: 'Hello, ' + store.currentState.name})
      )
   })
```

### Side effects

#### `sideEffects()`

```ts
createStore({ name: '' })
   .actionTypes<{
      setName: string 
   }>()
   .updates(lens => ({
      setName: name => lens.setFields({name})
   }))
   .sideEffects({
      setName: name => console.log(name)
   })
```

### Dependency Injection
