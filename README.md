# lenrix

#### Type-safe, reactive, lens-focused, immutable state management

### Introduction
lenrix is a Reactive alternative to Redux

### Quickstart

#### Install
```sh
$ npm i -S lenrix immutable-lens rxjs
```

#### Create a store and define actions
```ts
import {createStore} from 'lenrix'
import {add} from 'ramda'

export type State = {
    counter: number
}

const initialState: State = {
    counter: 0
}

export const store = createStore(initialState) 

export const actions = {
    increment() {
        // ALL THESE ARE EQUIVALENT AND 100% TYPE SAFE
        store.update(state => ({counter: state.counter + 1}))
        store.updateFields({counter: val => val + 1})
        store.focusOn('counter').update(val => val + 1)
        store.focusOn('counter').update(add(1)) // Using Ramda's automatically curryied functions
    }
}
```

#### Consume the store's state
```ts
import {store, actions} from './store'

// ALL THESE ARE EQUIVALENT AND 100% TYPE SAFE
const counter1$: Observable<number> = store.state$.map(state => state.counter)
const counter2$: Observable<number> = store.map(state => state.counter)
const counter3$: Observable<number> = store.select('counter')
const counter4$: Observable<number> = store.focusOn('counter').state$
```
