const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const guildData = require('../source/guildData.js');
const barracks = require('../source/barracks.js');
const arenaManager = require('../source/arenaManager.js');
const userHandler = require('../source/userHandler.js');

test('guild fighter and arena state stays isolated', t => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildA = `900${suffix}`;
    const guildB = `901${suffix}`;
    const guildDirectoryA = path.join(__dirname, '..', 'data', 'guilds', guildA);
    const guildDirectoryB = path.join(__dirname, '..', 'data', 'guilds', guildB);
    t.after(() => {
        fs.rmSync(guildDirectoryA, { recursive: true, force: true });
        fs.rmSync(guildDirectoryB, { recursive: true, force: true });
    });

    guildData.run(guildA, () => {
        barracks.LoadAllFighters();
        const fighterHolder = barracks.GetFighterHolder();
        fighterHolder.allFighters['0'] = { id: 0, name: 'Guild A fighter' };
        fighterHolder.nextId = 1;
        barracks.SaveFighters();
        userHandler.GetLocalUserByDiscordUser({ id: '1001', globalName: 'Guild A', username: 'guild-a' });

        arenaManager.ResetArena();
        arenaManager.GetArena().state = 'battling';
        arenaManager.SaveArena('currentArena');
    });

    guildData.run(guildB, () => {
        barracks.LoadAllFighters();
        assert.deepEqual(barracks.GetFighterHolder().allFighters, {});
        userHandler.GetLocalUserByDiscordUser({ id: '1002', globalName: 'Guild B', username: 'guild-b' });
        assert.deepEqual(Object.keys(userHandler.GetConfig().users), ['1002']);
        assert.equal(arenaManager.GetArena().state, 'initialisation');
    });

    guildData.run(guildA, () => {
        assert.equal(barracks.GetFighterHolder().allFighters['0'].name, 'Guild A fighter');
        assert.deepEqual(Object.keys(userHandler.GetConfig().users), ['1001']);
        assert.equal(arenaManager.GetArena().state, 'battling');
    });
});
