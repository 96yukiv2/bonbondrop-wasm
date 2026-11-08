# bonbondrop-wasm

Rust + WebAssembly + Three.js で、ぷっくりしたシールをブラウザ上で触れる実験プロジェクトです。ちいかわマーケットの[ボンボンドロップシール（ハチワレ）](https://chiikawamarket.jp/products/4901770777122)を参考に、シール1枚を手描き風のイラストで表現しています。非公式の個人制作です。

シールを押すと凹み、離すと戻ります。ドラッグすると端が持ち上がり、離した場所に貼り直せます。「もとの位置にもどす」で初期位置に戻ります。マウスとタッチ操作に対応しています。変形と剥離の動きは簡略化した近似であり、物理シミュレーションではありません。

## 構成

- `bonbondrop/`: Rust製の凹み、剥離とバネ・減衰計算（Wasm）
- `web/`: Vite + TypeScript + Three.js

## 起動

Rust、wasm-pack、Node.js（Vite 8対応版）を用意してください。

```sh
wasm-pack build bonbondrop --target web
cd web
npm install
npm run dev
```

## テストとビルド

```sh
cargo test --manifest-path bonbondrop/Cargo.toml
wasm-pack build bonbondrop --target web
cd web
npm install
npm run build
```
