import { expect } from 'chai'

import { shallowEquals } from './shallowEquals'

const expectEqual = <T>(a: T, b: T) =>
   expect(shallowEquals(a, b)).to.equal(true)

const expectDifferent = <T>(a: T, b: T) =>
   expect(shallowEquals(a, b)).to.equal(false)

describe('shallowEquals()', () => {
   it('compares two equal numbers', () => {
      expectEqual(1, 1)
   })

   it('compares two different numbers', () => {
      expectDifferent(1, 2)
   })

   it('returns true when comparing an array with itself', () => {
      const array = [1]
      expectEqual(array, array)
   })

   it('returns false when comparing two identical arrays', () => {
      expectDifferent([1], [1])
   })

   it('returns false when object with array', () => {
      expectDifferent({}, [])
   })

   ///////////////////////
   // NULL & UNDEFINED //
   /////////////////////

   it('returns false when comparing object with null', () => {
      expectDifferent({}, null)
   })

   it('returns false when comparing null with object', () => {
      expectDifferent(null, {})
   })

   it('returns false when comparing object with undefined', () => {
      expectDifferent({}, undefined)
   })

   it('returns false when comparing undefined with object', () => {
      expectDifferent(undefined, {})
   })

   it('returns false when comparing array with null', () => {
      expectDifferent([], null)
   })
   it('returns false when comparing null with array', () => {
      expectDifferent(null, [])
   })

   it('returns false when comparing number with null', () => {
      expectDifferent(1, null)
   })

   it('returns false when comparing null with number', () => {
      expectDifferent(null, 1)
   })

   it('returns true when comparing null with null', () => {
      expectEqual(null, null)
   })

   it('returns false when comparing number with undefined', () => {
      expectDifferent(1, undefined)
   })

   it('returns false when comparing undefined with number', () => {
      expectDifferent(undefined, 1)
   })

   it('returns true when comparing undefined with undefined', () => {
      expectEqual(undefined, undefined)
   })

   it('returns false when comparing null with undefined', () => {
      expectDifferent(null, undefined)
   })

   it('returns false when comparing undefined with null', () => {
      expectDifferent(undefined, null)
   })
})
