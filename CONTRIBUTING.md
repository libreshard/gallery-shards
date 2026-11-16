# Contributing

Thanks for helping. Fixes to keys, new pages and new shards are all welcome.

## Before you start

- **Default shortcuts only.** A shard must work with the program's or game's default keys, with
  nothing to set up. When a control has no default key, use a free one and say in the button's note
  how to assign it in the program.
- **Check every key** in the program itself (or its official shortcut list) and say how you checked
  in the pull request.
- **No logos, artwork, fonts or interface copied** from the program or game. Names are fine to say
  what the shard is for, but a shard's name must not look official.
- **Panels:** change them in LibreShard's panel editor, then copy its `panel.json` (and new images)
  back into the folder. Keep `shard.json` in sync and raise its `version`.

## Pull requests

1. Branch from `main` with a prefix: `feat/`, `fix/`, `docs/` or `cleanup/`.
2. Add a line to the shard's `CHANGELOG.md` under `## [Unreleased]`.
3. Run `node tools/build.mjs <id>` (see the [README](README.md#building)): it must pass.
4. Sign off every commit (see below).

## Licensing of contributions and the DCO

This repository is licensed under the [Apache License 2.0](LICENSE). By contributing, you agree that
your contribution is licensed under the same terms (as section 5 of the license says). The copies of
LibreShard's `shard-base` (`libreshard.css` and `libreshard.js` in the shards with code) are under
MIT-0, like the originals.

We also use the [Developer Certificate of Origin](https://developercertificate.org/) (DCO): a
statement that you wrote the change or otherwise have the right to submit it under the project's
license. You make it by adding a `Signed-off-by` line to each commit, with a name and email that
identify you:

```
Signed-off-by: Jane Doe <jane@example.com>
```

Git adds it for you with `git commit -s`. If you forgot, `git commit --amend -s` fixes the last
commit, and `git rebase --signoff main` fixes every commit in your branch.

There's no contributor license agreement (CLA) to sign.

<details>
<summary>Developer Certificate of Origin 1.1</summary>

```
By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

</details>

## Code of conduct

This project follows LibreShard's
[code of conduct](https://github.com/libreshard/libreshard/blob/main/CODE_OF_CONDUCT.md).
