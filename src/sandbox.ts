import { createStore } from './createStore'

type RootState = {
   name: string
}

const initialRootState: RootState = {
   name: 'Bob'
}

const createRootStore = (initialState: RootState = initialRootState) =>
   createStore(initialState)

const createMessageStore = (rootStore: ReturnType<typeof createRootStore>) =>
   rootStore.compute(({ name }) => ({ message: 'Hello, ' + name }))

// const createMessageStore = createStoreCreator(createRootStore, rootStore =>
//    rootStore.compute(({ name }) => ({ message: 'Hello, ' + name }))
// )

export const createCore = (initialState: RootState) => {
   const rootStore = createRootStore(initialState)
   const messageStore = createMessageStore(rootStore)
   return {
      store: rootStore,
      message: {
         store: messageStore
      }
   }
}

const core = createCore({ name: 'Bob' })

const { store } = core

store.filter(state => state.name.length > 0)

store
   .detectChange((previous, next) => previous.name !== next.name)
   .detectFieldChange({
      name: (previous, next) => previous !== next
   })
   .computeFromFields(['name'], ({ name }) => ({ nameLength: name.length }))
