import { expect } from 'chai'
import { isPlainObject } from '../../src/util/isPlainObject'

const sut = isPlainObject

describe(sut.name, () => {
   it('accepts plain object', () => {
      expect(sut({})).to.be.true
   })
   it('rejects number', () => {
      expect(sut(42)).to.be.false
   })
   it('rejects array', () => {
      expect(sut([])).to.be.false
   })
   it('rejects function', () => {
      expect(sut(() => {})).to.be.false
   })
})
