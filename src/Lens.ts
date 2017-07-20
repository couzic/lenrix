export interface ValueUpdater<V> {
   (value: V): V
}

export type FieldsUpdater<T> = object & { [K in keyof T]?: T[K] | ValueUpdater<T[K]> }

export interface Lens<T, Target> {

   focusOn<K extends keyof Target>(key: K): Lens<T, Target[K]>

   focusAt<NewTarget>(lens: Lens<Target, NewTarget>): Lens<T, NewTarget>

   focusIndex<Item>(this: Lens<T, Item[]>, index: number): Lens<T, Item | undefined>

   read(source: T): Target

   setValue(source: T, newValue: Target): T

   update(source: T, updater: ValueUpdater<Target>): T

   // TODO runtime check : fields NOT a function
   updateFields(this: Lens<T, Target & object>, source: T, fields: FieldsUpdater<Target>): T
}

export type UnfocusedLens<T> = Lens<T, T>

export function createLens<T>(instance?: T): UnfocusedLens<T> {
   return {} as any
}
