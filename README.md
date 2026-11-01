# bonbondrop-wasm

A browser-based 3D squishy sticker experiment using Rust, WebAssembly, TypeScript and Three.js.

## Structure

- `bonbondrop/`: Rust/Wasm deformation model
- `web/`: Vite/TypeScript/Three.js frontend

## Development

Install Rust, wasm-pack, Node.js and npm, then:

```sh
cd bonbondrop
wasm-pack build --target web
cd ../web
npm install
npm run dev
```

Tap or click the pink dome to dent its surface. This first prototype deliberately does not simulate spring-back.
