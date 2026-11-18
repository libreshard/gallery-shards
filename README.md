# LibreShard gallery shards

Shards made by the [LibreShard](https://libreshard.com) project for its
[gallery](https://libreshard.com/gallery/): panels for everyday programs and cockpits for games.
Install them from the app (**Shards → Explore the gallery**) or from each shard's release here.

> These shards are unofficial. They aren't affiliated with or endorsed by the makers of the
> programs and games they work with, and they contain none of their logos or artwork. Program and
> game names are used only to say what each shard is for (see LibreShard's
> [trademark policy](https://github.com/libreshard/libreshard/blob/main/TRADEMARKS.md)).

## The shards

| Shard | For | Kind | Releases |
|---|---|---|---|
| [Image editing](edicion-imagen) | Photoshop, Affinity Photo, Krita and GIMP, on Windows and Linux | Code | [releases](https://github.com/libreshard/gallery-shards/releases?q=%22Image+editing%22&expanded=true) |
| [SC MFD](sc-mfd) | The space game SC 4.x, on Windows | Code | [releases](https://github.com/libreshard/gallery-shards/releases?q=%22SC+MFD%22&expanded=true) |
| [Stream Control](obs) | OBS Studio, on Windows and Linux | Code | [releases](https://github.com/libreshard/gallery-shards/releases?q=%22Stream+Control%22&expanded=true) |

Shards use the default keyboard shortcuts of their program or game, so there's nothing to change
there. The exception is a program with no default shortcuts, such as OBS Studio: Stream Control
walks you through giving it its keys, once.
Shards never read the program's state, so a switch on the tablet can show the wrong state if you
change it with the keyboard or mouse (see each shard's notes).

## Two kinds of shard

- **Panels** (`panel.json` + `shard.json`) are made with LibreShard's panel editor. To change one,
  install it and open it in the editor (**Shards → Edit**), or download its folder and open
  `panel.json`. `shard.json` holds what its manifest says (name, icon, description, version).
- **Shards with code** (`manifest.json`, `index.html`, …) are plain web pages, like the shards that
  come with LibreShard. `libreshard.css` and `libreshard.js` are copies of the app's `shard-base`.

Each folder also has `gallery.json` (the gallery's tags) and `CHANGELOG.md`. A shard can add its
own checks in `tools/check.js` (icons, profiles…): the build runs it from the shard's folder first
and stops that shard if it fails. `tools/`, `docs/`, `README*`, `gallery.json` and `CHANGELOG.md`
stay in this repository; they aren't packaged.

## Building

`tools/build.mjs` builds every shard with LibreShard's own code (the panel template, the zip
writer and the install checks), so it needs a checkout of the app with its dependencies, at the
version in `app-version.txt` (panels carry the app's panel template inside):

```sh
git clone --branch "$(cat app-version.txt)" https://github.com/libreshard/libreshard
cd libreshard && npm ci && cd ..
node tools/build.mjs          # every shard, into out/ (finds ./libreshard, or set LIBRESHARD_DIR)
node tools/build.mjs office   # just one
```

`app-version.txt` moves by hand when a new LibreShard version comes out: then every panel is built
again with its template.

**Reproducible builds.** The same commit, built with the same LibreShard version, gives the same
bytes and so the same sha256 on any system: files are added in name order and dated by the last
commit that touched the shard's folder, in UTC. To check a release, clone this repository with its
history, check out the tag and build that shard: the sha256 must match its gallery entry and
`SHA256SUMS.txt`. CI builds with Node 24. A shard that isn't committed, or has changes, still
builds, with a warning; a release (`--release`) refuses both.

For each shard, `out/` gets the `.libreshard` file and its entry for the gallery
([libreshard/shards](https://github.com/libreshard/shards)). `--format` rewrites hand-edited
`panel.json` files in the editor's form, and `--sync-base` refreshes the `shard-base` copies.

## Releases

Each shard has its own version and releases. Pushing a tag `<id>-v<version>` (for example
`office-v1.0.0`) builds that shard and creates a draft release with the file, its gallery entry and
`SHA256SUMS.txt`. The tag must match the version in the shard's `shard.json` or `manifest.json`, and
its `CHANGELOG.md` needs an entry for it. Once the release is published, the gallery entry goes to
libreshard/shards in a pull request with a screenshot.

A release is titled with the shard's name and version ("SC MFD 3.2.0"), and the links in the table
above search for that name. GitHub marks only one release of the whole repository as "Latest", so
that badge says nothing about the other shards: use each shard's link instead.

## Contributing

Fixes and new shards are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). Every commit needs a
`Signed-off-by` line (`git commit -s`).

## License

[Apache License 2.0](LICENSE).
