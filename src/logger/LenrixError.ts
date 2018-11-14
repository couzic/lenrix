export interface LenrixError {
   source: LenrixErrorSource
   nativeError: Error
}

type LenrixErrorSource = UpdateError | EpicError | ComputeError

interface UpdateError {
   type: 'update'
   actionType: string
   payload: any
}

interface EpicError {
   type: 'epic'
   store: any
   actionType: string
}

interface ComputeError {
   type: 'compute'
   store: any
   values: string[]
}
