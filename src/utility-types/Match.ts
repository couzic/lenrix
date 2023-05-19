export type Match<A, B> = Extract<A, B> extends never ? false : true
