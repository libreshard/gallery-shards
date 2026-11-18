# Stream Control

Buttons for [OBS Studio](https://obsproject.com/) on your tablet: record, stream, save a replay,
mute the microphone or the desktop audio, and switch between up to six scenes. They work with any
app in front, so you can stay in your game.

> Unofficial: not affiliated with or endorsed by the OBS Project. It contains none of its logos.

## Set up

OBS has no default hotkeys, so you give it the keys this shard presses, once:

1. Install the shard from LibreShard's gallery (**Shards → Explore the gallery**).
2. On the tablet, open it and tap **Set up**. It lists each OBS entry with the key for it.
3. In OBS, open **Settings → Hotkeys**, click an entry's field, and tap **Send** on the tablet. Where
   two entries are listed (Start + Stop), give both the same key: one button then turns it on and
   off.

The shard's settings (LibreShard on the PC → **Shards → Stream Control → Settings**) choose the key
set (automatic by system; the Windows one uses Ctrl+Shift+F18…F22 and Shift+Alt+F13…F18, the Linux
one avoids the keys GNOME takes for itself), how many scene buttons to show (up to six) and their
names.

## Notes

- The buttons don't read OBS: they press a key, and OBS shows whether it's recording, streaming or
  muted.
- Saving a replay needs the replay buffer running in OBS.

Windows and Linux. See [CHANGELOG.md](CHANGELOG.md). License: [Apache 2.0](../LICENSE).
