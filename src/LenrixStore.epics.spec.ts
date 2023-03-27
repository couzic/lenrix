import * as chai from 'chai'
import { pipe } from 'rxjs'
import { distinctUntilChanged, map, mapTo } from 'rxjs/operators'
import { SinonStub, stub } from 'sinon'
import * as sinonChai from 'sinon-chai'

import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

chai.use(sinonChai)
const { expect } = chai

type State = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const initialState: State = {
   counter: 0,
   todo: {
      input: '',
      list: [],
      count: 0
   }
}

interface Actions {
   buttonClicked: void
   incrementCounter: void
   setCounter: number
   setTodoCount: number
}

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<Actions>()
      .updates(_ => ({
         incrementCounter: () => _.updateFields({ counter: val => val + 1 }),
         setCounter: counter => _.setFields({ counter }),
         setTodoCount: todoCount =>
            _.focusPath('todo', 'count').setValue(todoCount)
      }))
      .updates({
         buttonClicked: () => state => state
      })
      .pureEpics({
         buttonClicked: mapTo({ incrementCounter: undefined })
      })

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore Epics', () => {
   let store: RootStore

   beforeEach(() => {
      store = createRootStore()
   })

   it('dispatches actions', () => {
      store.dispatch({ buttonClicked: undefined })
      expect(store.currentState.counter).to.equal(1)
   })

   it('dispatches actions for every dispatched epic', () => {
      store.dispatch({ buttonClicked: undefined })
      store.dispatch({ buttonClicked: undefined })
      expect(store.currentState.counter).to.equal(2)
   })

   it('throws error when dispatching two action types in same object', () => {
      expect(() => {
         createStore(initialState, { logger: silentLoggerOptions })
            .actionTypes<Actions>()
            .pureEpics({
               buttonClicked: mapTo({
                  setCounter: 0,
                  incrementCounter: undefined
               })
            })
            .dispatch({ buttonClicked: undefined, setCounter: 0 })
      }).to.throw()
   })

   it('gives registered epics access to store currentState', () => {
      expect(store.currentState.todo.list.length).to.equal(0)
      expect(store.currentState.todo.count).to.equal(0)

      store.epics(s => ({
         setCounter: map(() => ({
            setTodoCount: s.currentState.counter
         }))
      }))
      store.dispatch({ setCounter: 42 })

      expect(store.currentState.todo.count).to.equal(42)
   })

   it('supports distinctUntilChanged()', () => {
      expect(store.currentState.counter).to.equal(0)
      store.pureEpics({
         setTodoCount: pipe(
            distinctUntilChanged(),
            mapTo({ incrementCounter: undefined })
         )
      })
      store.dispatch({ setTodoCount: 42 })
      expect(store.currentState.counter).to.equal(1)
      store.dispatch({ setTodoCount: 42 })
      expect(store.currentState.counter).to.equal(1)
   })

   it('supports multiple epics for single action', () => {
      expect(store.currentState.counter).to.equal(0)
      store.pureEpics({
         setTodoCount: mapTo({ incrementCounter: undefined })
      })
      store.pureEpics({
         setTodoCount: mapTo({ incrementCounter: undefined })
      })
      store.dispatch({ setTodoCount: 42 })
      expect(store.currentState.counter).to.equal(2)
   })

   describe('when registering epics after first action has been dispatched', () => {
      beforeEach(() => {
         stub(console, 'log')
         store.dispatch({ buttonClicked: undefined })
         store.pureEpics({
            setTodoCount: mapTo({ incrementCounter: undefined })
         })
      })
      it('logs warning', () => {
         expect(console.log).to.have.been.calledOnce
      })
      afterEach(() => {
         ;(console.log as SinonStub).restore()
      })
   })

   it('updates state even after previous epic threw an error', () => {
      store = createStore(initialState, { logger: silentLoggerOptions })
         .actionTypes<Actions>()
         .updates(_ => ({
            incrementCounter: () => _.updateFields({ counter: val => val + 1 })
         }))
         .pureEpics({
            setCounter: map(counter => {
               if (counter !== 1)
                  throw new Error('Should be caught by LenrixStore')
               else return { incrementCounter: undefined }
            })
         })

      store.dispatch({ setCounter: 99999999 }) // Error
      store.dispatch({ setCounter: 1 }) // OK

      expect(store.currentState.counter).to.equal(1)
   })
})
