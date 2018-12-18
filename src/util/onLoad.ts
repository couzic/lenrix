export function onLoad(fn: () => void) {
   try {
      window.addEventListener('load', fn)
   } catch (e) {
      fn()
   }
}
