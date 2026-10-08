const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const barracks = require('../source/barracks.js');
const guildData = require('../source/guildData.js');

test('GetFighterHolder lazily loads and caches fighters for the current guild', t => {
    const guildId = `906${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
    t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

    guildData.run(guildId, () => {
        const firstHolder = barracks.GetFighterHolder();
        assert.deepEqual(firstHolder.allFighters, {});
        assert.equal(barracks.GetFighterHolder(), firstHolder);

        firstHolder.allFighters['0'] = {
            id: 0,
            name: 'Lazy-loaded fighter',
            userLocalId: 1,
        };
        firstHolder.nextId = 1;
        barracks.SaveFighters();

        const savedHolder = JSON.parse(fs.readFileSync(path.join(guildDirectory, 'fighters.json'), 'utf8'));
        assert.equal(savedHolder.allFighters['0'].name, 'Lazy-loaded fighter');
    });
});
