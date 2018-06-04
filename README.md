# lenrix

#### 🔎 + Redux + RxJS + TypeScript = ❤️ 

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Motivation](#motivation)
- [Features](#features)
- [Quickstart](#quickstart)
  - [Install](#install)
  - [rootStore.ts](#rootstorets)
  - [storeConsumer.ts](#storeconsumerts)
- [API](#api)
  - [Create](#create)
    - [`createStore()`](#createstore)
    - [`createFocusableStore()`](#createfocusablestore)
  - [Actions and Updates](#actions-and-updates)
    - [`actionTypes()`](#actiontypes)
    - [`updates()`](#updates)
    - [`dispatch()`](#dispatch)
  - [Consuming the state](#consuming-the-state)
    - [`state$`](#state)
    - [`computedState$`](#computedstate)
    - [`pluck()`](#pluck)
    - [`pick()`](#pick)
    - [`cherryPick()`](#cherrypick)
  - [Focus](#focus)
    - [`focusPath()`](#focuspath)
    - [`focusFields()`](#focusfields)
    - [`recompose()`](#recompose)
  - [Computed values (synchronous)](#computed-values-synchronous)
    - [`compute()`](#compute)
    - [`computeFromFields()`](#computefromfields)
    - [`computeFrom()`](#computefrom)
  - [Computed values (asynchronous)](#computed-values-asynchronous)
    - [`compute$()`](#compute)
    - [`computeFromFields$()`](#computefromfields)
    - [`computeFrom$()`](#computefrom)
    - [`defaultValues()`](#defaultvalues)
  - [`epics()`](#epics)
  - [Injected store](#injected-store)
  - [`sideEffects()`](#sideeffects)
  - [`dependencies()`](#dependencies)
- [Testing](#testing)
- [Logger](#logger)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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
 - Relevant reference equality checks performed out of the box
 - Separate functional slices with [Focused Stores](#focus)
 - Epics, just like [`redux-observable`](https://github.com/redux-observable/redux-observable), our favorite redux middleware

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
`lenrix` performs reference equality checks to prevent any unnecessary re-rendering.

The store provides the observable properties `state$` and `computedState$`. However, it is recommended to always use either `pluck()`, `pick()` or `cherryPick()` to select as little data as necessary. It will prevent components to re-render because an irrelevant slice of the state has changed.

#### `state$`
```ts
const store = createStore({name: 'Bob'})

const state$ = store.state$ // Observable<{name: string}> 
```

#### `computedState$`
Like `state$`, but the store's state is augmented with its [computed values](#computed-values-synchronous).

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

### Computed values (synchronous)
State should be normalized, derived data should be declared as computed values. In traditional redux, you would probably use selectors for that.

`lenrix` performs reference equality checks to prevent unnecessary recomputation.

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
### Computed values (asynchronous)
Every synchronous value-computing operator has an asynchronous equivalent.

Note that asynchronously computed values are initially undefined. If you want them to be non-nullable, see [`defaultValues()`](#defaultValues()).

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

### `epics()`
Let an action dispatch another action, asynchronously. Since this feature is heavily inspired from [`redux-observable`](https://github.com/redux-observable/redux-observable), we encourage you to go check their [documentation](https://redux-observable.js.org/docs/basics/Epics.html).
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

### `sideEffects()`
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

### Injected `store` and `dependencies`

A light version of the store and its registered dependencies are available when using the following operators :
 - [`compute()`](#compute)
 - [`compute$()`](#compute$)
 - [`computeFrom()`](#computeFrom)
 - [`computeFrom$()`](#computeFrom$)
 - [`computeFromFields()`](#computeFromFields)
 - [`computeFromFields$()`](#computeFromFields$)
 - [`epics()`](#epics)
 - [`sideEffects()`](#sideEffects)

```ts
createStore({ name: '' })
   .dependencies({
      greeter: (name: string) => 'Hello, ' + name
   })
   .compute((state, store, {greeter}) => ({
      greeting: greeter(store.currentState.name)
   }))
```

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
   .dependencies({
      greeter: (name: string) => 'Hello, ' + name
   })
   .epics({
      setName: (payload$, store, {greeter}) => payload$.pipe(
         mapTo({setGreeting: greeter(store.currentState.name)})
      )
   })
```

## Testing

> Testing an action creator, a reducer and a selector in isolation.

![Man in three pieces. Legs running in place. Torso doing push-ups. Head reading.](https://cdn-images-1.medium.com/max/1600/0*eCs8GoVZVksoQtQx.gif)
> "Looks like it’s working !"

## Logger


