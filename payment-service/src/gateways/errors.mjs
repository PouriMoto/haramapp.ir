export class GatewayError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'GatewayError'
    this.code = code
  }
}
