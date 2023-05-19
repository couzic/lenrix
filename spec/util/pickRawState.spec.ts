import { expect } from 'chai'
import { pickRawState } from '../../src/util/pickRawState'
import { StoreStateRaw } from '../../src/utility-types/StoreStateRaw'

const sut = pickRawState

describe(sut.name, () => {
   it('handles empty key array', () => {
      const state: StoreStateRaw<any> = {
         reduxState: {},
         values: {},
         loadableValues: {}
      }
      expect(sut(state, [])).to.deep.equal(state)
   })
   it('handles key for redux state', () => {
      const state: StoreStateRaw<any> = {
         reduxState: { name: 'name', other: 'should not be picked' },
         values: {},
         loadableValues: {}
      }
      expect(sut(state, ['name'])).to.deep.equal({
         reduxState: { name: 'name' },
         values: {},
         loadableValues: {}
      })
   })
   it('handles key for computed value', () => {
      const state: StoreStateRaw<any> = {
         reduxState: {},
         values: { name: 'name', other: 'should not be picked' },
         loadableValues: {}
      }
      expect(sut(state, ['name'])).to.deep.equal({
         reduxState: {},
         values: { name: 'name' },
         loadableValues: {}
      })
   })
   it('handles key for loadable value', () => {
      const state: StoreStateRaw<any> = {
         reduxState: {},
         values: {},
         loadableValues: {
            name: {
               error: undefined,
               status: 'loading',
               value: undefined
            },
            other: {
               error: undefined,
               status: 'loading',
               value: undefined
            }
         }
      }
      expect(sut(state, ['name'])).to.deep.equal({
         reduxState: {},
         values: {},
         loadableValues: {
            name: {
               error: undefined,
               status: 'loading',
               value: undefined
            }
         }
      })
   })
})
