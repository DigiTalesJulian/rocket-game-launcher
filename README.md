# Rocket Game Launcher

An open-source, configurable game launcher for presenting multiple games at once at a venue in a compact view for players.

## Features

- Fullscreen kiosk launcher that returns after a game exits
- Per-event setup via a `.rocket` config file and game folders
- Relative paths using `~` (resolved to the folder that contains the `.rocket` file)
- Studio logo and banner loaded automatically from fixed filenames
- Gamepad support (D-pad / left stick to move, A to launch; selection wraps)

## Planned

- Carousel mode (fullscreen tile per game, move left/right)
  - Auto-preview after ~30s of no input
- Theme customization
- Keyboard support

---

## Development setup

The app lives in the **`Rocket/`** subfolder. All install and run commands below assume you are in that folder.

Stack: **Electron**, **React**, **webpack** (via `electron-webpack`), with **yarn** for dependencies.

### What to install

1. **[Node.js](https://nodejs.org/en/)** — LTS is fine (the project scripts already work around OpenSSL/Webpack issues on newer Node versions such as 22).
2. **Yarn** (classic v1), if you do not have it:

   ```powershell
   npm i -g yarn
   ```

   Prefer yarn over npm for this repo; npm has been unreliable with these dependencies.

### First-time setup

```powershell
cd Rocket
yarn install
```

---

## Commands

Run these from **`Rocket/`**.

| Command | What it does |
|--------|----------------|
| `yarn install` | Installs dependencies into `node_modules/`. Run after clone or when `package.json` changes. |
| `yarn dev` | Starts the app in development mode (webpack + Electron). Use this while editing UI or launcher logic. Load a `.rocket` file via **Browse file** (e.g. `example/example.rocket`). |
| `yarn compile` | Compiles main/renderer bundles without packaging an exe. Used internally by `yarn dist`. |
| `yarn dist` | Compiles, then builds a **Windows portable** exe with electron-builder. |

### Build output

After `yarn dist`:

- **Ship this:** `dist/rocket <version>.exe` (portable launcher)
- **Safe to delete:** `dist/win-unpacked/` (unpacked Electron tree; not needed for distribution)

Other platforms are untested.

---

## `.rocket` files

A `.rocket` file is JSON listing the games to show and in which order.

Allowed fields per project (see also JSDoc in `Rocket/app/common/rocket.js`):

| Field | Required | Meaning |
|-------|----------|---------|
| `description` | yes | Text shown under the artwork |
| `executable` | yes | Path to the game `.exe` or `.bat`. Use `~` for “relative to this `.rocket` file’s folder”. |

**Not** listed in the config (loaded automatically from the executable’s folder):

- `banner.png` — game artwork
- `logo.png` — studio logo

Example (see `Rocket/example/example.rocket`):

```json
{
    "projects": [
        {
            "description": "Short blurb for the player.",
            "executable": "~\\Lacuna\\game.exe"
        }
    ]
}
```

Valid JSON only — no trailing commas.

---

## Preparing a launcher for an event

### 1. Build the exe

From `Rocket/`:

```powershell
yarn dist
```

Copy `dist/rocket <version>.exe` to the machine or USB stick you will use on site.

### 2. Create an event folder

Put the exe next to your config and game data, for example:

```text
MyEvent/
  rocket 0.1.1.exe
  event.rocket
  Lacuna/
    game.exe          ← (or .bat that starts the real game)
    banner.png        ← required name
    logo.png          ← required name
  BetweenHorizons/
    game.exe
    banner.png
    logo.png
  ...
```

Folder names are up to you; what matters is that `executable` in the `.rocket` file points at the right file, and that each of those folders contains `banner.png` and `logo.png`.

### 3. Point the config at each game

In `event.rocket`, list every game with `description` + `executable`.  
`~` means “the folder that contains this `.rocket` file”:

```text
"executable": "~\\Lacuna\\game.exe"
```

### 4. On the venue PC

1. Run the portable `.exe`
2. Choose **Browse file** and select your `.rocket` file
3. Games appear as tiles (logo, banner, description)
4. Click or use a gamepad to select and launch

Only one game runs at a time; when it exits, control returns to the launcher.

### Checklist

- [ ] Portable exe built (`yarn dist`)
- [ ] `.rocket` file with valid JSON (`description` + `executable` per game)
- [ ] Each game folder has the real executable (or a `.bat` that launches it)
- [ ] Each game folder has `banner.png` and `logo.png` (exact names)
- [ ] Paths in the `.rocket` file match your folder/file names
- [ ] Spot-check launch once on the target machine before the event
