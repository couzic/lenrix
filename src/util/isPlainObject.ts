export const isPlainObject = (o: unknown): o is object => {
   if (Array.isArray(o)) return false
   return typeof o === 'object'
}
