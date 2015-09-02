declare module Lambda {

  interface Context {
    done(error: any, result: any): void
    done(error: any): void
    done(): void
    succeed(v: any): void
    succeed(): void
    fail(v: any): void
    fail(): void
    getRemainingTimeInMillis(): number
    awsRequestId: string
    logStreamName: string
    functionName: string
  }

  interface IntercomUserSyncEvent {
    secret: string
    name: string
    email: string
    tags: string
  }
}
