# lenrix

#### 🔎 + Redux + RxJS + TypeScript = ❤️

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Motivation](#motivation)
- [Features](#features)
- [Quickstart](#quickstart)
  - [Install](#install)
- [API](#api)
  - [Create](#create)
    - [`createStore()`](#createstore)
    - [`createFocusableStore()`](#createfocusablestore)
  - [Actions and Updates](#actions-and-updates)
    - [`actionTypes()`](#actiontypes)
    - [`updates()`](#updates)
    - [`dispatch()`](#dispatch)
    - [`action()`](#action)
  - [Consuming the state](#consuming-the-state)
    - [`state$`](#state)
    - [`currentState`](#currentstate)
    - [`pluck()`](#pluck)
    - [`pick()`](#pick)
    - [`cherryPick()`](#cherrypick)
  - [Focus](#focus)
    - [`focusPath()`](#focuspath)
    - [`focusFields()`](#focusfields)
    - [`recompose()`](#recompose)
    - [Passing fields as readonly values](#passing-fields-as-readonly-values)
  - [Computed values (synchronous)](#computed-values-synchronous)
    - [`computeFromField()`](#computefromfield)
    - [`computeFromFields()`](#computefromfields)
    - [`computeFrom()`](#computefrom)
  - [Computed values (asynchronous)](#computed-values-asynchronous)
    - [`compute$()`](#compute)
    - [`computeFromField$()`](#computefromfield)
    - [`computeFromFields$()`](#computefromfields)
    - [`computeFrom$()`](#computefrom)
    - [`defaultValues()`](#defaultvalues)
  - [`epics()`](#epics)
  - [`pureEpics()`](#pureepics)
  - [`sideEffects()`](#sideeffects)
  - [Injected `store`](#injected-store)
- [Testing](#testing)
  - [Test Setup](#test-setup)
    - [Root store](#root-store)
  - [Asserting state](#asserting-state)
  - [Asserting calls on dependencies](#asserting-calls-on-dependencies)
  - [Asserting dispatched actions](#asserting-dispatched-actions)
- [Logger](#logger)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Motivation

A lot of people have complained about `redux`, some with good reason. Many have been drawn to other state management solutions.

> Don't throw the baby with the bathwater.

Although we agree there must be a better way than classical `redux`, we are not willing to sacrifice all of the `redux` goodness you've heard so much about.

> Making redux great again !

`lenrix` is a `redux` store wrapper that :

-  Dramatically reduces boilerplate
-  Eliminates the need for thunky middleware and selector libraries
-  Makes no compromise on type-safety
-  Embraces reactive programming
-  Prevents unnecessary re-rendering

## Features

-  Declarative API for deep state manipulation, powered by [`immutable-lens`](https://github.com/couzic/immutable-lens)
-  Reactive state and selectors, powered by [`rxjs`](https://github.com/reactivex/rxjs)
-  Relevant reference equality checks performed out of the box
-  Separate functional slices with [Focused Stores](#focus)
-  Epics, just like [`redux-observable`](https://github.com/redux-observable/redux-observable), our favorite redux middleware

## Quickstart

### Install

```bash
npm install --save lenrix redux rxjs immutable-lens
```

**`rootStore.ts`**

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

**`storeConsumer.ts`**

```ts
import { rootStore } from './rootStore'

const message$ = rootStore.pluck('message') // Observable<string>
const slice$ = rootStore.pick('message') // Observable<{message: string}>

rootStore.dispatch({ setMessage: 'Hello !!!' })
```

## API

### Create

#### `createStore()`

```ts
import { createStore } from 'lenrix'

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
const store = createStore({ name: 'Bob' }).actionTypes<{
   setName: string
}>()
```

#### `updates()`

Once action types are defined, it is possible to register type-safe updates. See [`immutable-lens`](https://github.com/couzic/immutable-lens) for `lens` API documentation.

```ts
const store = createStore({ name: 'Bob' })
   .actionTypes<{ setName: string }>()
   // THESE FOUR CALLS TO updates() ARE ALL EQUIVALENT AND 100% TYPE SAFE
   // PICK THE ONE YOU PREFER
   .updates({
      setName: name => state => ({ ...state, name })
   })
   .updates(lens => ({
      setName: name => lens.setFields({ name })
   }))
   .updates(lens => ({
      setName: name => lens.focusPath('name').setValue(name)
   }))
   // And if really like curry...
   .updates(lens => ({
      setName: lens.focusPath('name').setValue()
   }))
```

**Only _ONE_ updater can be registered for a single action type.** Failing to comply with that rule will result in an error:

```
Error: Cannot register two updaters for the same action type
```

When an action needs to update the state at a wider scope, move your updater to a store that has larger focus.

#### `dispatch()`

Dispatching an action can trigger an [update](#updates), an [epic](#epics), or a [side effect](#sideEffects).

```ts
store.dispatch({ setName: 'John' }) // Next state will be : {name: 'John'}
```

#### `action()`

Create an action dispatcher, which can be handily used in a `React` component for example.

```ts
const setName = store.action('setName')
setName('John') // Same as store.dispatch({setName: 'John'})
```

### Consuming the state

`lenrix` performs reference equality checks to prevent any unnecessary re-rendering.

The store provides the properties `state$` and `currentState`. However, we recommend you to use either `pluck()`, `pick()` or `cherryPick()` to select as little data as necessary. It will prevent components to re-render because an irrelevant slice of the state has changed.

#### `state$`

The store's normalized state augmented with its readonly values.

```ts
const store = createStore({ name: 'Bob' })

store.state$ // Observable<{name: string}>
```

#### `currentState`

Handy for testing.

```ts
const store = createStore({ name: 'Bob' })

store.currentState.name // 'Bob'
```

#### `pluck()`

Conceptually equivalent to `focusPath(...).state$`

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

const pick$ = rootStore.pick('user', 'todoList') // Observable<{ user: string, todoList: string[] }>
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

const cherryPick$ = rootStore.cherryPick(lens => ({
   // immutable-lens
   counter: lens.focusPath('counter'),
   userName: lens.focusPath('user', 'name')
})) // Observable<{ counter: number, userName: string }>
```

### Focus

**A focused store is just a proxy for the root store; there always is a single source of truth.**

Most UI components only interact with a small part of the whole state tree. A focused store provides read and update access to a precise subset of the full state.

Typically, you will create a focused store for a specific page (1st level routable component). Then, if the page is functionnally rich, more stores can be derived from the page-focused store. These deep-focused stores will probably be tailored for specific components or groups of components within the page.

All these stores form a tree of stores, with the one returned by `createStore()` at its root. All dispatched actions are propagated to the root store, where updates are applied. The updated state then flows down the tree of stores, with [values computed](#computed-values-synchronous) at some of the nodes and made available to their children.

However, that propagation stops at the stores for which the state slice in their scope has not changed.

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

userNameStore.state$ // Observable<string>
```

#### `focusFields()`

```ts
const rootStore = createStore({
   counter: 0,
   username: 'Bob'
})

const counterStore = rootStore.focusFields('counter')

counterStore.state$ // Observable<{counter: number}>
```

#### `recompose()`

Most powerful focus operator. It allows you to create state representations composed of deep properties from distinct state subtrees. See [`immutable-lens`](https://github.com/couzic/immutable-lens) for lens API documentation.

```ts
const rootStore = createStore({
   a: {
      b: {
         c: {
            d: string
         }
      }
   },
   e: {
      f: {
         g: {
            h: string
         }
      }
   }
})

rootStore.recompose(lens => ({
   // immutable-lens
   d: lens.focusPath('a', 'b', 'c', 'd'),
   h: lens.focusPath('e', 'f', 'g', 'h')
})).state$ // Observable<{ d: string, h: string }>
```

#### Passing fields as readonly values

All three focus operators `focusPath()`, `focusFields()` and `recompose()` support passing fields as readonly values.

```ts
const rootStore = createStore({
   a: {
      b: {
         c: 'c'
      }
   },
   user: 'Bob'
})

const focusedStore = rootStore.focusPath(['a', 'b', 'c'], ['user'])
focusedStore.state$ // Observable<{ c: string, user: string }>
```

Note that in this example, updates registered on the focused store can't modify the `user` value

### Computed values (synchronous)

State should be normalized, derived data should be declared as computed values. In traditional redux, you would probably use selectors for that.

`lenrix` performs reference equality checks to prevent unnecessary recomputation.

#### `computeFromField()`

Specify the field used for the computation to avoid useless re-computations.

```ts
createStore({ name: 'Bob', irrelevant: 'whatever' })
   .computeFromField('name', name => ({ message: 'Hello, ' + name }))
   .pick('message') // Observable<{message: string}>
```

#### `computeFromFields()`

Specify the fields used for the computation to avoid useless re-computations.

```ts
createStore({ name: 'Bob', irrelevant: 'whatever' })
   .computeFromFields(['name'], ({ name }) => ({ message: 'Hello, ' + name }))
   .pick('message') // Observable<{message: string}>
```

#### `computeFrom()`

Define computed values from state slices focused by lenses. The signature is similar to `recompose()` and `cherryPick()`.

```ts
createStore({ name: 'Bob', irrelevant: 'whatever' })
   .computeFrom(
      lens => ({ name: lens.focusPath('name') }),
      ({ name }) => ({ message: 'Hello, ' + name })
   )
   .pick('message') // Observable<{message: string}>
```

### Computed values (asynchronous)

Every synchronous value-computing operator has an asynchronous equivalent.

Note that asynchronously computed values are initially undefined. If you want them to be non-nullable, see [`defaultValues()`](<#defaultValues()>).

#### `compute$()`

```ts
import { map, pipe } from 'rxjs'

createStore({name: 'Bob'})
   .compute$(
      // WITH SINGLE OPERATOR...
      map(state => ({message: 'Hello, ' + state.name}))
      // ... OR WITH MULTIPLE OPERATORS
      pipe(
         map(state => state.name),
         map(name => ({message: 'Hello, ' + name}))
      )
   )
   .pick('message') // Observable<{message: string | undefined}>
```

#### `computeFromField$()`

```ts
import { map } from 'rxjs'

createStore({ name: 'Bob', irrelevant: 'whatever' })
   .computeFromField$(
      'name',
      map(name => ({ message: 'Hello, ' + name }))
   )
   .pick('message') // Observable<{message: string | undefined}>
```

#### `computeFromFields$()`

```ts
import { map } from 'rxjs'

createStore({ name: 'Bob', irrelevant: 'whatever' })
   .computeFromFields$(
      ['name'],
      map(({ name }) => ({ message: 'Hello, ' + name }))
   )
   .pick('message') // Observable<{message: string | undefined}>
```

#### `computeFrom$()`

```ts
import { map } from 'rxjs'

createStore({name: 'Bob', irrelevant: 'whatever'})
   .computeFrom$(
      lens => ({name: lens.focusPath('name')}),
      map(({name}) => ({message: 'Hello, ' + name}))
   .pick('message') // Observable<{message: string | undefined}>
```

#### `defaultValues()`

Define defaults for read-only values.

```ts
import { map } from 'rxjs'

createStore({ name: 'Bob' })
   .compute$(map(({ name }) => ({ message: 'Hello, ' + name })))
   .defaultValues({
      message: ''
   })
   .pick('message') // Observable<{message: string}>
```

### `epics()`

Let an action dispatch another action, asynchronously. Since this feature is heavily inspired from [`redux-observable`](https://github.com/redux-observable/redux-observable), we encourage you to go check their [documentation](https://redux-observable.js.org/docs/basics/Epics.html).

```ts
import { pipe } from 'rxjs'
import { map } from 'rxjs'

createStore({name: '', message: ''})
   .actionTypes<{
      setName: string
      setMessage: string
   }>()
   .updates(lens => ({
      setName: name => lens.setFields({name}),
      setMessage: message => lens.setFields({message})
   }))
   .epics(store => ({
      // WITH SINGLE OPERATOR...
      setName: map(name => ({setMessage: 'Hello, ' + name}))
      // ... OR WITH MULTIPLE OPERATORS
      setName: pipe(
         map(name => 'Hello, ' + name),
         map(message => ({setMessage: message}))
      )
   }))
```

### `pureEpics()`

Same as [`epics()`](<#epics()>), without the [injected `store`](#injected-store) instance.

```ts
...
   .pureEpics({
      setName: map(name => ({setMessage: 'Hello, ' + name}))
   })
```

### `sideEffects()`

Declare synchronous side effects to be executed in response to actions. Useful for pushing to browser history, stuff like that...

```ts
createStore({ name: '' })
   .actionTypes<{
      setName: string
   }>()
   .updates(lens => ({
      setName: name => lens.setFields({ name })
   }))
   .sideEffects({
      setName: name => console.log(name)
   })
```

### Injected `store`

A light version of the store is made available when using the following operators :

-  [`compute$()`](#compute$)
-  [`computeFrom$()`](#computeFrom$)
-  [`computeFromFields$()`](#computeFromFields$)
-  [`epics()`](#epics)
-  [`sideEffects()`](#sideEffects)

```ts
import { map } from 'rxjs'

createStore({ name: '', greeting: '' })
   .actionTypes<{
      setName: string
      setGreeting: string
   }>()
   .updates(lens => ({
      setName: name => lens.setFields({ name }),
      setGreeting: greeting => lens.setFields({ greeting })
   }))
   .epics(store => ({
      setName: map(() => ({ setGreeting: store.currentState.name }))
   }))
```

## Testing

> Testing an action creator, a reducer and a selector in isolation.

![Man in three pieces. Legs running in place. Torso doing push-ups. Head reading.](https://cdn-images-1.medium.com/max/1600/0*eCs8GoVZVksoQtQx.gif)

> "Looks like it’s working !"

Testing in `redux` usually implies testing in isolation the pieces that together form the application's state management system. It seems reasonable, since they are supposed to be pure functions.

Testing in `lenrix` follows a different approach. Well, technically, in most cases it would still be possible to write tests the `redux` way, but that's not what we had in mind when we designed it.

A `lenrix` store is to be considered a cohesive **unit** of functionality. We want to **test it as a whole**, by interacting with its public API. We do not want to test its internal implementation details.

As a consequence, we believe store testing should essentially consist in :

-  [Dispatching actions](#dispatch)
-  [Asserting state](#asserting-state) (normalized state + computed values)

In some less frequent cases, testing might also consist in :

-  [Asserting calls on dependencies](#asserting-calls-on-dependencies)
-  [Asserting dispatched actions](#asserting-dispatched-actions)

### Test Setup

Each test should run in isolation, therefore we need to create a new store for each test. The most straightforward way is to wrap all store creation code in factory functions.

#### Root store

**`RootStore.ts`**

```ts
import { createStore } from 'lenrix'

export const initialRootState = {
   user: {
      name: ''
   }
}

export type RootState = typeof initialRootState

export const createRootStore = (initialState = initialRootState) =>
   createStore(initialState)

export type RootStore = ReturnType<typeof createRootStore>
```

**`RootStore.spec.ts`**

```ts
import 'jest'
import { createRootStore, RootStore } from './RootStore'

describe('RootStore', () => {
   let store: RootStore

   beforeEach(() => {
      store = createRootStore()
   })
})
```

### Asserting state

Most tests should limit themselves to dispatching actions and verifying that the state has correctly updated.

The distinction between normalized state and readonly values should be kept hidden as an implementation detail. Tests should not make assumptions about a value being either readonly or part of the normalized state, as it is subject to change without breaking public API nor general behavior.

**`RootStore.ts`**

```ts
import { createStore } from 'lenrix'

export const createRootStore = (initialState = { name: '' }) =>
   createStore(initialState)
      .actionTypes<{
         setName: string
      }>()
      .updates(lens => ({
         setName: name => lens.setFields({ name })
      }))
      .compute(({ name }) => ({
         message: 'Hello, ' + name
      }))

export type RootStore = ReturnType<typeof createRootStore>
```

**`RootStore.spec.ts`**

```ts
import 'jest'
import { createRootStore, RootStore } from './RootStore'

describe('RootStore', () => {
   let store: RootStore

   beforeEach(() => {
      store = createRootStore()
   })

   test('updates name when "setName" dispatched', () => {
      store.dispatch({ setName: 'Bob' })

      expect(store.currentState.name).toEqual('Bob')
   })

   test('updates message when "setName" dispatched', () => {
      store.dispatch({ setName: 'Steve' })

      expect(store.currentState.message).toEqual('Hello, Steve')
   })
})
```

### Asserting calls on dependencies

### Asserting dispatched actions

## Logger

<!--
Consider a `redux` store. It's an object holding the application's whole state, which can be a massive, complex and deep JavaScript plain object. Such complexity can be hard to maintain, so tricks like `combineReducers()` have been invented to allow some kind of concern separation. The store maintains not only the whole state, but also all the operations that can make changes to that state, in the form of reducers (well, technically there's only one reducer, but let's not bother with the technical details right now). So a store is really :
> state + operations to change the state

Looks a lot like an object to me (as in Object-Oriented Programming). A store has a well encapsulated state, the only way to change it is to interact with the store's public API. It even has a typical `getState()` accessor. State of the art OOP !

Of course there are major differences between a classical object and a `redux` store, I'm just trying to point out that conceptually, a store can be thought of as a an object with state and behavior. And how do you test an object with state and behavior ? Here's the first thing I can think of :
> Call a method and make assertions on the state

Let's translate this in `redux` lingo :
> Dispatch an action and make assertions on the state

I hear you asking : "Isn't it the same thing as testing the reducer in isolation ?"

In simple cases, yes, the outcome would be identical. However, in real-life situations where middleware is involved, a single action can trigger a chain of actions. Dispatching an action would effectively trigger the middleware, testing the reducer in isolation would not.
-->
