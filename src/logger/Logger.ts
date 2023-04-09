import { FocusedAction } from '../utility-types/FocusedAction'
import { LenrixError } from './LenrixError'

export interface Logger {
   message: (action: FocusedAction) => void
   update: (action: FocusedAction) => void
   epic: (action: FocusedAction) => void
   compute: (previous: object | undefined | null, next: object) => void
   loading: (selection: any) => void
   loaded: (values: object) => void
   error: (error: LenrixError) => void
}
