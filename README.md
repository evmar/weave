# weave, a wasm viewer

## Demo

https://evmar.github.io/weave/; you can drag'n'drop your own wasm file, or
browse some random files I have been looking at:

- figma.com [13mb, C++](https://evmar.github.io/weave/?wasm/figma.wasm)
- gioui.org demo [7mb, Golang](https://evmar.github.io/weave/?wasm/gioui-demo.wasm)
- retrowin32 [723kb, Rust](https://evmar.github.io/weave/?wasm/rust.wasm)

## Development

To hack on visualization:

```
$ npm i
$ cd viz
$ npm run serve
```

You can add `?foo.wasm` to the URL to load a wasm file from the `viz` subdir while hacking.

## Deploying demo

Setup:

```
$ git worktree demo
```

Deploy:

```
$ ./deploy.sh demo
$ cd demo
$ git commit -a --amend
$ git push -f
```
