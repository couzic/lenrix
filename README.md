# lenrix

#### Lens-focused, type-safe, reactive state management

### Introduction
lenrix is a Reactive alternative to Redux

### Quickstart

#### Install
```sh
$ npm i -S lenrix rxjs
```

#### Create a root store and define actions
```ts
import {createRootStore} from 'lenrix'
import {add} from 'ramda'

export type State = {
    counter: number
}

const initialState: State = {
    count: 0
}

export const store = createRootStore(initialState) 

export const actions = {
    increment() {
        // All these are equivalent and type-safe
        store.update(state => ({counter: state.counter + 1}))
        store.updateState({counter: val => val + 1})
        store.updateState({counter: add(1)}) // Using Ramda's automatically curryied functions
        store.focus(state => state.counter).update(add(1))
        store.focusOn('counter').update(add(1))
    }
}
```

#### Consume the store's state
```ts
import {store, actions} from './store'

// Recommended ways (all equivalent and all type-safe)
const counter1$: Observable<number> = store.state$.map(state => state.counter)
const counter2$: Observable<number> = store.map(state => state.counter)
const counter3$: Observable<number> = store.select('counter')
const counter4$: Observable<number> = store.focus(state => state.counter).state$
const counter5$: Observable<number> = store.focusOn('counter').state$

// Alternative way (useful for testing)
expect(store.currentState.count).toEqual(0)
actions.increment()
expect(store.currentState.count).toEqual(1)
```

### What is sparix ?
First, it's a pattern. Second, it's an implementation based on RxJS. The implementation is quite trivial, and it would only take a couple hours to rewrite it with another reactive library. However, since the SPA world is to be dominated by React and Angular2, and since the latter ships with RxJS, it made sense to use this library for the reference implementation of sparix.

### Immutablility
In sparix, the state is modeled as an `Observable<State>`, an immutable stream of state transitions.

### Testability
A Store's API is kept simple, and all the complex logic is encapsulated and hidden from the outside, just like you would do with good old Object Oriented Programming. To test a Store, all you need to do is simulate an input (by calling one of its public methods) and check its output (the state).

### How it compares to redux
Sparix completely adheres to the redux principle (or rather, the Elm Architecture principle) where state transformations are defined as pure functions which do not mutate the previous state.

In redux, when you need to update the state, you dispatch an action. But if you look closely, you might realize that actions can be sorted in two categories :
* Actions that represent commands. They target a single reducer, to update a single subset of the state tree. Their names are usually in imperative form (*ADD_TODO*, *INCREMENT_COUNTER*...). I'll refer to them as **Updaters**.
* Actions that represent events. They target one or many reducers, to notify the system that something happened. Their names are usually in declarative form (*TODO_SAVED*, *TODO_SAVE_FAILED*...). I refer to them as **Events**.
 
My claim is that actions are too heavy a mechanism when the goal is simply to update a single Store's state (as in most cases). In sparix, a Store can directly update its state with no more ceremony than:
```ts
// Increment counter
this.update(state => ({
    counter: state.counter + 1
}))
```
There is a finer-grained, more declarative way to write these state updaters:
```ts
this.updateState({
    counter: prevCounter => prevCounter + 1
})
```
Or even better:
```ts
const increment = value => value + 1

this.updateState({
    counter: increment
})
```
Well, actually you should leverage Ramda's automatic currying:
```ts
import {add} from 'ramda'

this.updateState({
    counter: add(1)
})
```
I like to think of these state updaters as anonymous actions. In redux, it would be like dispatching a reducer. But what about action creators ? Well, we don't need them really: 
```ts
const increment = val => val + 1

class SomeStore extends Store<SomeState> {
    // constructor
    incrementCounter() {
        this.updateState({
            counter: increment
        })
    }
}
```
Here, the `incrementCounter()` method is part of the Store's public API. You no longer need to dispatch a global action created by an action creator. Just call the method !
