export type ActionObject<Actions> = {
   [ActionType in keyof Actions]: { [type in ActionType]: Actions[type] }
}[keyof Actions]
