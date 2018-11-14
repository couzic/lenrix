import { FocusedAction } from '../util/FocusedAction'
import { LenrixError } from './LenrixError'

export interface Logger {
   message: (action: FocusedAction) => void
   update: (action: FocusedAction) => void
   epic: (action: FocusedAction) => void
   compute: (previous: object, next: object) => void
   error: (error: LenrixError) => void
}
