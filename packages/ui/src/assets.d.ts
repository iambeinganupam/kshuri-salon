// Module declarations for static asset imports used by bundlers (Vite / tsup).
// TypeScript does not resolve these by default; declaring them as strings
// satisfies the type checker. The actual URL is resolved at bundle time.
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
