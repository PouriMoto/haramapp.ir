export type ApiErrorCode = 'network' | 'rate_limited' | 'validation' | 'server' | 'not_found'

export class ApiError extends Error {
  code: ApiErrorCode
  constructor(code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export class ValidationError extends ApiError {
  field: string
  constructor(field: string, message: string) {
    super('validation', message)
    this.name = 'ValidationError'
    this.field = field
  }
}
