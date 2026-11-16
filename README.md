# LibreShard gallery shards

Shards made by the [LibreShard](https://libreshard.com) project for its
[gallery](https://libreshard.com/gallery/): panels for everyday programs and cockpits for games.
Install them from the app (**Shards → Explore the gallery**) or from each shard's release here.

> These shards are unofficial. They aren't affiliated with or endorsed by the makers of the
> programs and games they work with, and they contain none of their logos or artwork. Program and
> game names are used only to say what each shard is for (see LibreShard's
> [trademark policy](https://github.com/libreshard/libreshard/blob/main/TRADEMARKS.md)).

## The shards

| Shard | For | Kind |
|---|---|---|

Every shard uses the default keyboard shortcuts of its program or game: there's nothing to set up.
Shards never read the program's state, so a switch on the tablet can show the wrong state if you
change it with the keyboard or mouse (see each shard's notes).

## Two kinds of shard

- **Panels** (`panel.json` + `shard.json`) are made with LibreShard's panel editor. To change one,
  install it and open it in the editor (**Shards → Edit**), or download its folder and open
  `panel.json`. `shard.json` holds what its manifest says (name, icon, description, version).
- **Shards with code** (`manifest.json`, `index.html`, …) are plain web pages, like the shards that
  come with LibreShard. `libreshard.css` and `libreshard.js` are copies of the app's `shard-base`.

Each folder also has `gallery.json` (the gallery's tags) and `CHANGELOG.md`.

## Building

`tools/build.mjs` builds every shard with LibreShard's own code (the panel template, the zip
writer and the install checks), so it needs a checkout of the app with its dependencies:

```sh
git clone https://github.com/libreshard/libreshard
cd libreshard && npm ci && cd ..
LIBRESHARD_DIR=libreshard node tools/build.mjs          # every shard, into out/
LIBRESHARD_DIR=libreshard node tools/build.mjs office   # just one
```

For each shard, `out/` gets the `.libreshard` file and its entry for the gallery
([libreshard/shards](https://github.com/libreshard/shards)). `--format` rewrites hand-edited
`panel.json` files in the editor's form, and `--sync-base` refreshes the `shard-base` copies.

## Releases

Each shard has its own version and releases. Pushing a tag `<id>-v<version>` (for example
`office-v1.0.0`) builds that shard and creates a draft release with the file, its gallery entry and
`SHA256SUMS.txt`. The tag must match the version in the shard's `shard.json` or `manifest.json`, and
its `CHANGELOG.md` needs an entry for it. Once the release is published, the gallery entry goes to
libreshard/shards in a pull request with a screenshot.

## Contributing

Fixes and new shards are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). Every commit needs a
`Signed-off-by` line (`git commit -s`).

## License

[Apache License 2.0](LICENSE).
