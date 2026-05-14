declare module "node:*" {
  const value: any // eslint-disable-line @typescript-eslint/no-explicit-any
  export = value
}

declare const Buffer: any // eslint-disable-line @typescript-eslint/no-explicit-any

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined
  }
}
