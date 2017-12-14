# lenrix

#### Type-safe, reactive, focusable redux stores

## Introduction
lenrix wraps a redux store with a richer API:
 - Less boilerplate
 - More type-safety
 - Reactive programming with Epics (stolen from redux-observable)
 - Focusable stores (Lenses, anyone ?)

## Quickstart

### Install
```sh
$ npm i -S lenrix immutable-lens redux rxjs
```

### Create a store and define actions and updates
```ts
import { createStore } from 'lenrix'

export const store = createStore({message: ''})
   .actionTypes<{
      setMessage: string
   }>()
   .updates(_ => ({
      // ALL THESE ARE EQUIVALENT AND 100% TYPE SAFE
      // PICK THE ONE YOU PREFER !!!
      setMessage: (message) => (state) => ({message})
      setMessage: (message) => _.setFields({message})
      setMessage: (message) => _.focusPath('message').setValue(message)
      setMessage: _.focusPath('message').setValue()
   }))
```

### Dispatch an action
```ts
store.dispatch({setMessage: 'Hello !!!'})
```

### Consume the store's state
```ts
import { store } from './store'

const message$: Observable<string> = store.pluck('message')
const pick$: Observable<{message: string}> = store.pick('message')
```

## API

### Create

#### `createStore()`
```typescript
import {createStore} from 'lenrix'

type State = {
   user: {
      id:number
      name: string
   }
}

const initialState: State = {
   user: {
      id: 123,
      name: 'John Doe'
   }
}

const store = createStore(initialState)
```

### Focus

#### `focusPath()`

#### `focusFields()`

#### `recompose()`

### Read

#### `pluck()`

#### `pick()`

#### `cherryPick()`

### Updates

### Epics
