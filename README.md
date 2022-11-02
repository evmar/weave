# weave, a wasm viewer

## Demo

https://evmar.github.io/weave/; you can drag'n'drop your own wasm file, or
browse some random files I have been looking at:

- [figma.com wasm bundle](https://evmar.github.io/weave/?wasm/figma.wasm) (13mb, C++)
- [gioui.org demo](https://evmar.github.io/weave/?wasm/gioui-demo.wasm) (7mb, Golang)
- [Rust wasm hello world](https://evmar.github.io/weave/?wasm/rust_bg.wasm) (<1kb, Rust)

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
