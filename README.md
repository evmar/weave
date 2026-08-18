# weave, a wasm viewer

## Demo

https://evmar.github.io/weave/; you can drag'n'drop your own wasm file, or
browse some random files I have been looking at:

- figma.com [13mb, C++](https://evmar.github.io/weave/?wasm/figma.wasm)
- gioui.org demo [7mb, Golang](https://evmar.github.io/weave/?wasm/gioui-demo.wasm)
- [retrowin32](https://github.com/evmar/retrowin32) [1.7mb, Rust](https://evmar.github.io/weave/?wasm/retrowin32.wasm)
- [ghostty](https://ghostty.org/) [900kb, Zig](https://evmar.github.io/weave/?wasm/ghostty-vt.wasm)

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
$ jj workspace add demo
```

Deploy:

```
$ ./deploy.sh demo
$ cd demo
$ jj squash
$ jj git push
```

The Figma wasm was pulled directly from the site.
The ghostty wasm is from https://github.com/ghostty-org/ghostty/releases/tag/tip .
