import type { ApiError } from '../../types/models'
export function toApiError(error:unknown):ApiError{return error&&typeof error==='object'&&'message'in error?error as ApiError:{message:'An unexpected error occurred.'}}
