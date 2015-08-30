declare module Lambda {
  interface Context {
    done(v: any): void
    done(): void
  }

  interface Event {

  }
}
