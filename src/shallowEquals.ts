export function shallowEquals<T>(a: T, b: T) {
   if (a === b) return true
   if (typeof a !== typeof b) return false
   if (typeof a !== 'object'
      || a === null
      || b === null
      || Array.isArray(a)
      || Array.isArray(b)) return false

   // Both are non-null, non-array objects
   const keysA = Object.keys(a)
   const keysB = Object.keys(b)
   if (keysA.length !== keysB.length) return false
   for (let i in a) if (!(i in b)) return false
   for (let i in b) if (a[i] !== b[i]) return false
   return true
}
