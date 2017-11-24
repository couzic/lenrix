import { Updater } from 'immutable-lens'

export type FocusedHandlers<State, Actions> = {[ActionType in keyof Actions]?: (payload: Actions[ActionType]) => Updater<State> }
