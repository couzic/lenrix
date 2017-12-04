import { FocusedAction } from '../FocusedAction'

export interface Logger {
   message: (action: FocusedAction) => void
   update: (action: FocusedAction) => void
   epic: (action: FocusedAction) => void
   compute: (previous: object, next: object) => void
}
