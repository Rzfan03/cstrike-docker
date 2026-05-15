const express = require('express');
const { GameDig } = require('gamedig');

const app = express();
app.use(express.json());

const GAMEDIG_CONFIG = {
    type: 'counterstrike16',
    host: '127.0.0.1',
    port: 27015
};

let cacheData = null;
let lastCacheTime = 0;
const CACHE_TIMEOUT = 5000;

async function getServerData() {
    const now = Date.now();
    if (cacheData && (now - lastCacheTime < CACHE_TIMEOUT)) {
        return cacheData;
    }

    const state = await GameDig.query(GAMEDIG_CONFIG);
    cacheData = {
        status: 'online',
        name: state.name,
        map: state.map,
        players_online: state.players.length,
        max_players: state.maxplayers,
        ping: state.ping,
        players: state.players.map(p => ({
            name: p.name,
            score: p.raw ? p.raw.score : (p.score || 0),
            time: p.raw ? Math.round(p.raw.time) : 0
        })),
        updated_at: new Date().toLocaleTimeString()
    };
    lastCacheTime = now;
    return cacheData;
}

app.get('/api/status', async (req, res) => {
    try {
        const data = await getServerData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'offline', error: error.message });
    }
});

app.get('/api/search', async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Parameter nama harus diisi!' });

    try {
        const data = await getServerData();
        const foundPlayers = data.players.filter(p => 
            p.name.toLowerCase().includes(name.toLowerCase())
        );

        res.json({
            is_online: foundPlayers.length > 0,
            matches: foundPlayers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/widget', async (req, res) => {
    try {
        const data = await getServerData();
        res.send(`🎮 ${data.name} | 🗺️ ${data.map} | 👥 ${data.players_online}/${data.max_players}`);
    } catch (error) {
        res.status(500).send('❌ Server Offline');
    }
});

app.get('/api/map', async (req, res) => {
    try {
        const data = await getServerData();
        res.json({
            current_map: data.map,
            map_image_url: `/assets/maps/${data.map}.jpg`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Monitoring API pro berjalan di http://localhost:${PORT}`);
});