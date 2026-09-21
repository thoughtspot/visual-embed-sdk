// `react-dom/client` (React 18+'s createRoot entry point) has no type
// declarations bundled with the `@types/react-dom@17` devDependency this
// package builds against. Declared minimally, for internal use only
// (DebugAgent's lazy mount in src/embed/base.ts) — not part of the public API.
declare module 'react-dom/client' {
    interface Root {
        render(children: unknown): void;
        unmount(): void;
    }

    export function createRoot(container: Element | DocumentFragment): Root;
}
