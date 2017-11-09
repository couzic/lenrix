export function shallowEquals(a: any, b: any) {
   if (a === b) return true
   for (let i in a) if (!(i in b)) return false
   for (let i in b) if (a[i] !== b[i]) return false
   return true
}
