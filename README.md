# bonbondrop-wasm

Rust + WebAssembly + Three.js で、ぷっくりシールの変形をブラウザ上に再現する実験プロジェクトです。

## 構成
- `bonbondrop/`: Rust製の凹みモデルとバネ・減衰計算（Wasm）
- `web/`: Vite + TypeScript + Three.js

## 起動方法
Rust、wasm-pack、Node.js（Vite 8対応版）を用意してください。

```sh
wasm-pack build bonbondrop --target web
cd web
npm install
npm run dev
```

ピンク色の半球を押すと凹み、離すとバネ・減衰モデルによって戻ります。

## テストとビルド

```sh
cargo test --manifest-path bonbondrop/Cargo.toml
wasm-pack build bonbondrop --target web
cd web
npm install
npm run build
```

※凹みの方向は現段階ではY方向のみです。横から押した際の自然な変形、複数の凹み、シールの輪郭は未実装です。
