const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const fighterHistoryCommand = require('../commands/kingdominion/fighter-history.js');
const renameCommand = require('../commands/kingdominion/rename.js');
const barracks = require('../source/barracks.js');
const guildData = require('../source/guildData.js');

test('rename is owner-only, announces publicly, and preserves identity history for public lookup', async t => {
    const guildId = `905${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
    t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

    await guildData.run(guildId, async () => {
        barracks.LoadAllFighters();
        const fighterHolder = barracks.GetFighterHolder();
        fighterHolder.allFighters = {
            '0': { id: 0, name: 'Old name', icon: '🐉', userLocalId: 1 },
            '1': { id: 1, name: 'Taken', icon: '🦊', userLocalId: 2 },
        };
        fighterHolder.nextId = 2;
        barracks.SaveFighters();

        const replies = [];
        const interaction = {
            user: { id: 'rename-user', username: 'Rename user' },
            locale: 'en-US',
            options: {
                getString(name) {
                    return {
                        name: 'Old name',
                        'new-name': 'New name',
                        'new-icon': '👨‍👩‍👧‍👦',
                    }[name];
                },
            },
            async reply(payload) {
                replies.push(payload);
            },
        };

        await renameCommand.execute(interaction);
        assert.equal(replies.at(-1).flags, undefined);
        assert.deepEqual(replies.at(-1).allowedMentions, { parse: [] });
        assert.match(replies.at(-1).content, /Old name.*New name/);
        assert.equal(fighterHolder.allFighters['0'].name, 'New name');
        assert.equal(fighterHolder.allFighters['0'].icon, '👨‍👩‍👧‍👦');
        assert.deepEqual(
            fighterHolder.allFighters['0'].identityHistory.map(({ name, icon }) => ({ name, icon })),
            [{ name: 'Old name', icon: '🐉' }]
        );

        interaction.options.getString = name => ({
            name: 'New name',
            'new-name': 'Taken',
            'new-icon': '🐯',
        }[name]);
        await renameCommand.execute(interaction);
        assert.equal(replies.at(-1).flags, require('discord.js').MessageFlags.Ephemeral);
        assert.equal(fighterHolder.allFighters['0'].name, 'New name');

        interaction.user = { id: 'another-user', username: 'Another user' };
        interaction.options.getString = name => ({
            name: 'New name',
            'new-name': 'Other name',
            'new-icon': '🐯',
        }[name]);
        await renameCommand.execute(interaction);
        assert.equal(replies.at(-1).flags, require('discord.js').MessageFlags.Ephemeral);
        assert.equal(fighterHolder.allFighters['0'].name, 'New name');

        interaction.user = { id: 'rename-user', username: 'Rename user' };
        interaction.options.getString = () => 'New name';
        await fighterHistoryCommand.execute(interaction);
        assert.equal(replies.at(-1).flags, undefined);
        assert.deepEqual(replies.at(-1).allowedMentions, { parse: [] });
        assert.match(replies.at(-1).content, /Current identity: 👨‍👩‍👧‍👦 \*\*New name\*\*/);
        assert.match(replies.at(-1).content, /🐉 \*\*Old name\*\*/);

        const savedHolder = JSON.parse(fs.readFileSync(path.join(guildDirectory, 'fighters.json'), 'utf8'));
        assert.equal(savedHolder.allFighters['0'].identityHistory[0].name, 'Old name');
        assert.equal(savedHolder.allFighters['0'].identityHistory[0].icon, '🐉');
    });
});
