const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const barracks = require('../source/barracks.js');
const guildData = require('../source/guildData.js');

test('retiring a fighter preserves its record and removes it from the active roster', t => {
    const guildId = `902${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
    t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

    guildData.run(guildId, () => {
        barracks.LoadAllFighters();
        const fighterHolder = barracks.GetFighterHolder();
        fighterHolder.allFighters['0'] = {
            id: 0,
            name: 'Retired fighter',
            userLocalId: 1,
            wins: 3,
            losses: 2,
        };
        fighterHolder.nextId = 1;
        barracks.SaveFighters();

        assert.equal(barracks.RetireFighter(0), true);
        assert.equal(barracks.RetireFighter(0), false);
        assert.deepEqual(barracks.GetFightersForUser(1), []);

        const savedHolder = JSON.parse(fs.readFileSync(path.join(guildDirectory, 'fighters.json'), 'utf8'));
        assert.equal(savedHolder.allFighters['0'].isRetired, true);
        assert.equal(savedHolder.allFighters['0'].name, 'Retired fighter');
        assert.equal(savedHolder.allFighters['0'].wins, 3);
        assert.equal(savedHolder.allFighters['0'].losses, 2);
        assert.ok(savedHolder.allFighters['0'].retiredAt);
    });
});
