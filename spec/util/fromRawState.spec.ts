import { expect } from 'chai'
import { fromRawState } from '../../src/util/fromRawState'
import { StoreStateRaw } from '../../src/utility-types/StoreStateRaw'

const sut = fromRawState

describe(sut.name, () => {
   it('handles empty state', () => {
      const state: StoreStateRaw<any> = {
         reduxState: {},
         values: {},
         loadableValues: {}
      }
      expect(sut(state)).to.deep.equal({
         ...state,
         status: 'loaded',
         errors: [],
         data: {}
      })
   })
   it('handles state with redux state', () => {
      const state: StoreStateRaw<any> = {
         reduxState: {
            name: 'name'
         },
         values: {},
         loadableValues: {}
      }
      expect(sut(state)).to.deep.equal({
         ...state,
         status: 'loaded',
         errors: [],
         data: { name: 'name' }
      })
   })
   it('handles state with computed values', () => {
      const state: StoreStateRaw<any> = {
         reduxState: {},
         values: {
            name: 'name'
         },
         loadableValues: {}
      }
      expect(sut(state)).to.deep.equal({
         ...state,
         status: 'loaded',
         errors: [],
         data: { name: 'name' }
      })
   })
   it('prefers computed value to redux state', () => {
      const state: StoreStateRaw<any> = {
         reduxState: { name: 'should be overwritten' },
         values: {
            name: 'name'
         },
         loadableValues: {}
      }
      expect(sut(state)).to.deep.equal({
         ...state,
         status: 'loaded',
         errors: [],
         data: { name: 'name' }
      })
   })
   it('handles state with loaded values', () => {
      const state: StoreStateRaw<any> = {
         reduxState: {},
         values: {},
         loadableValues: {
            name: {
               error: undefined,
               status: 'loaded',
               value: 'name'
            }
         }
      }
      expect(sut(state)).to.deep.equal({
         ...state,
         status: 'loaded',
         errors: [],
         data: { name: 'name' }
      })
   })
   it('handles state with loading values', () => {
      const state: StoreStateRaw<any> = {
         reduxState: {},
         values: {},
         loadableValues: {
            name: {
               error: undefined,
               status: 'loading',
               value: undefined
            }
         }
      }
      expect(sut(state)).to.deep.equal({
         ...state,
         status: 'loading',
         errors: [],
         data: { name: undefined }
      })
   })
})
