
export type MergedFields<A, B> = {
   [K in keyof (A & B)]: (A & B)[K]
}
