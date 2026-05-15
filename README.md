# Counter-Strike 1.6 Server — Docker

A containerized Counter-Strike 1.6 dedicated server with Metamod, AMX Mod X, DProto, and PODBot. Built on top of the official SteamCMD Docker image and designed to run on any Linux host, including homelab systems like TrueNAS Scale.

---

## What is Included

**Metamod** is a plugin/DLL manager that sits between the Half-Life engine and a game mod, enabling dynamic loading and unloading of mod-like DLL plugins to extend server or game functionality.

**AMX Mod X** is a Metamod plugin for Half-Life 1 that provides comprehensive scripting capabilities. Scripts can intercept network messages, log events, handle commands and client commands, modify cvars, manipulate entities, and more.

**DProto** allows the server to accept non-Steam (cracked) clients. Without it, only users with a legitimate Steam account can connect.

**PODBot MetaMod** is an open source Metamod plugin that adds computer-controlled bot players to Counter-Strike.

---

## Quick Start

Pull the image:

```bash
docker pull cajuclc/cstrike-docker
```

Run the container:

```bash
docker run --name cstrike \
  -p 27015:27015/udp \
  -p 27015:27015 \
  cajuclc/cstrike-docker
```

---

## Custom Configuration

You can override default config files by mounting your own versions into the container. Any mounted file takes precedence over environment variable settings.

```bash
docker run --name cstrike \
  -p 27015:27015/udp \
  -p 27015:27015 \
  -v /path/to/your/server.cfg:/home/steam/cstrike/cstrike/server.cfg \
  cajuclc/cstrike-docker
```

Mountable config files:

| File | Container Path |
|------|----------------|
| `server.cfg` | `/home/steam/cstrike/cstrike/server.cfg` |
| `dproto.cfg` | `/home/steam/cstrike/cstrike/dproto.cfg` |
| `plugins.ini` | `/home/steam/cstrike/cstrike/plugins.ini` |
| `mapcycle.txt` | `/home/steam/cstrike/cstrike/mapcycle.txt` |

---

## Docker Compose

```bash
docker-compose up -d
```

A sample `docker-compose.yml` is provided in the repository.

---

## Monitoring API

The server exposes a lightweight REST API on port `4000` for real-time monitoring, player lookup, and map information. All responses are JSON unless otherwise noted.

**Base URL:**
```
http://<your-server-ip>:4000
```

---

### GET /api/status

Returns the current server state including player list, map, ping, and capacity.

**Request:**
```
GET /api/status
```

**Response — Online:**
```json
{
  "status": "online",
  "name": "My CS 1.6 Server",
  "map": "de_dust2",
  "players_online": 8,
  "max_players": 32,
  "ping": 14,
  "players": [
    {
      "name": "Player1",
      "score": 12,
      "time": 3420
    }
  ],
  "updated_at": "21:04:33"
}
```

**Response — Offline:**
```json
{
  "status": "offline",
  "error": "connect ECONNREFUSED 127.0.0.1:27015"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"online"` or `"offline"` |
| `name` | string | Server hostname |
| `map` | string | Current map name |
| `players_online` | number | Number of active players |
| `max_players` | number | Server slot capacity |
| `ping` | number | Server ping in milliseconds |
| `players` | array | List of connected players |
| `players[].name` | string | Player name |
| `players[].score` | number | Current score/kills |
| `players[].time` | number | Time connected in seconds |
| `updated_at` | string | Timestamp of last data update |

---

### GET /api/search

Searches for a player by name among currently connected players.

**Request:**
```
GET /api/search?name={player_name}
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | Yes | Full or partial player name (case-insensitive) |

**Response — Player Found:**
```json
{
  "is_online": true,
  "matches": [
    {
      "name": "Player1",
      "score": 12,
      "time": 3420
    }
  ]
}
```

**Response — Not Found:**
```json
{
  "is_online": false,
  "matches": []
}
```

**Response — Missing Parameter:**
```http
HTTP 400 Bad Request

{ "error": "Parameter nama harus diisi!" }
```

---

### GET /api/map

Returns the current map name and its thumbnail image path.

**Request:**
```
GET /api/map
```

**Response:**
```json
{
  "current_map": "de_dust2",
  "map_image_url": "/assets/maps/de_dust2.jpg"
}
```

Map thumbnails are served as static files from the `/assets/maps/` directory. To display a full image URL, prepend the base URL:

```
http://<your-server-ip>:4000/assets/maps/de_dust2.jpg
```

---

### GET /api/widget

Returns a plain-text one-liner summary of the server, suitable for embedding in bots, overlays, or status pages.

**Request:**
```
GET /api/widget
```

**Response — Online:**
```
My CS 1.6 Server | de_dust2 | 8/32
```

**Response — Offline:**
```
Server Offline
```

---

### Error Handling

All endpoints return HTTP `500` on internal errors with the following shape:

```json
{
  "error": "Description of what went wrong"
}
```

Data is cached for **5 seconds** server-side. Repeated requests within that window return the cached result without querying the game server again.

---

## PODBot Admin Menu

To use the PODBot admin menu in-game, mount the config file and set a password.

Mount the config:
```bash
-v /path/to/podbot.cfg:/home/steam/cstrike/cstrike/addons/podbot/podbot.cfg
```

Inside `podbot.cfg`, locate these two lines:
```
pb_passwordkey "_pbadminpw"
pb_password "your_password"
```

On your CS client, create or edit `cstrike/autoexec.cfg` inside your Half-Life installation:
```
setinfo _pbadminpw "your_password"
```

Then bind the menu in-game:
```
bind "=" "pb menu"
```

---

## AMX Mod X Admin Access

Mount the users file:
```bash
-v /path/to/users.ini:/home/steam/cstrike/cstrike/addons/amxmodx/configs/users.ini
```

A reference `users.ini` is available at: https://github.com/alliedmodders/amxmodx/blob/master/configs/users.ini

Add your username, IP, or Steam ID to the file, then add to `autoexec.cfg`:
```
setinfo _pw "your_password"
```

The `_pw` key comes from `amx_password_field "_pw"` defined in `amxx.cfg`.

---

## SteamCMD Notes

SteamCMD is used internally to install Counter-Strike 1.6. There is a known bug that prevents installation in a single command. See the Valve developer wiki for details: https://developer.valvesoftware.com/wiki/SteamCMD#Downloading_an_app

**Relevant Steam Application IDs:**

| ID | Game |
|----|------|
| 10 | Counter-Strike |
| 70 | Half-Life |
| 90 | Counter-Strike 1.6 Dedicated Server |

---

## TrueNAS Scale

For a step-by-step guide on running this image on TrueNAS Scale, see: https://www.cloudtutorial.net/run-counter-strike-1-6-server-on-truenas-scale/

---

## Credits

This project builds on work from several open source repositories:

- [counter-strike-docker](https://github.com/jimtouz/counter-strike-docker) by Dimitris Touzloudis
- [cs16-server](https://github.com/b4k3r/cs16-server) by Marcin Prokop
- [counter-strike_server](https://github.com/febLey/counter-strike_server) by febLey
