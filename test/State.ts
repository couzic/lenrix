export interface State {
   counter: number
   todo: TodoState
   user: User | undefined
   flag: boolean
   sorting: {
      order: 'ascending' | 'descending'
   }
}

export interface TodoState {
   input: string
   list: TodoItem[]
   count: number
}

export interface TodoItem {
   title: string
   done: boolean
}

export interface User {
   name: string
   address: {
      street: string
      city: string
   }
}

export const initialState: State = {
   counter: 42,
   todo: {
      input: 'input',
      list: [
         { title: 'item0', done: false },
         { title: 'item1', done: false },
         { title: 'item2', done: false }
      ],
      count: 42
   },
   user: undefined,
   flag: false,
   sorting: {
      order: 'ascending'
   }
}
