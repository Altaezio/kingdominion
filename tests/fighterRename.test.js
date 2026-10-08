const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const fighterHistoryCommand = require('../commands/kingdominion/fighter-history.js');
const renameCommand = require('../commands/kingdominion/rename.js');
const barracks = require('../source/barracks.js');
const guildData = require('../source/guildData.js');

test('/rename requires values and autocompletes the current identity for both new fields', () => {
    const options = renameCommand.data.toJSON().options;
    assert.equal(options.find(option => option.name === 'name').autocomplete, true);
    assert.equal(options.find(option => option.name === 'new-name').required, true);
    assert.equal(options.find(option => option.name === 'new-name').autocomplete, true);
    assert.equal(options.find(option => option.name === 'new-icon').required, true);
    assert.equal(options.find(option => option.name === 'new-icon').autocomplete, true);
});

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
        let optionValues = {
            name: 'Old name',
            'new-name': 'Old name',
            'new-icon': '🦁',
        };
        let focusedOption = { name: 'new-name', value: '' };
        let autocompleteChoices;
        const interaction = {
            user: { id: 'rename-user', username: 'Rename user' },
            locale: 'en-US',
            options: {
                getString(name) { return optionValues[name]; },
                getFocused() { return focusedOption; },
            },
            async reply(payload) {
                replies.push(payload);
            },
            async respond(choices) {
                autocompleteChoices = choices;
            },
        };

        await renameCommand.autocomplete(interaction);
        assert.deepEqual(autocompleteChoices, [{
            name: 'Keep current name: Old name',
            value: 'Old name',
        }]);
        focusedOption = { name: 'new-icon', value: '' };
        await renameCommand.autocomplete(interaction);
        assert.deepEqual(autocompleteChoices, [{
            name: 'Keep current icon: 🐉',
            value: '🐉',
        }]);

        await renameCommand.execute(interaction);
        assert.equal(replies.at(-1).flags, undefined);
        assert.deepEqual(replies.at(-1).allowedMentions, { parse: [] });
        assert.match(replies.at(-1).content, /Old name.*Old name/);
        assert.equal(fighterHolder.allFighters['0'].name, 'Old name');
        assert.equal(fighterHolder.allFighters['0'].icon, '🦁');
        assert.deepEqual(
            fighterHolder.allFighters['0'].identityHistory.map(({ name, icon }) => ({ name, icon })),
            [{ name: 'Old name', icon: '🐉' }]
        );

        optionValues = { name: 'Old name', 'new-name': 'Changed', 'new-icon': '🦁' };
        await renameCommand.execute(interaction);
        assert.equal(replies.at(-1).flags, undefined);
        assert.equal(fighterHolder.allFighters['0'].name, 'Changed');
        assert.equal(fighterHolder.allFighters['0'].icon, '🦁');

        optionValues = { name: 'Changed', 'new-name': 'New name', 'new-icon': '🦁' };
        await renameCommand.execute(interaction);
        assert.equal(replies.at(-1).flags, undefined);
        assert.equal(fighterHolder.allFighters['0'].name, 'New name');
        assert.equal(fighterHolder.allFighters['0'].icon, '🦁');
        assert.deepEqual(
            fighterHolder.allFighters['0'].identityHistory.map(({ name, icon }) => ({ name, icon })),
            [
                { name: 'Old name', icon: '🐉' },
                { name: 'Old name', icon: '🦁' },
                { name: 'Changed', icon: '🦁' },
            ]
        );

        optionValues = { name: 'New name', 'new-name': 'Taken', 'new-icon': '🦁' };
        const replyCountBeforeDuplicate = replies.length;
        await renameCommand.execute(interaction);
        assert.equal(replies.length, replyCountBeforeDuplicate + 1);
        assert.equal(replies.at(-1).flags, require('discord.js').MessageFlags.Ephemeral);
        assert.equal(fighterHolder.allFighters['0'].name, 'New name');

        interaction.user = { id: 'another-user', username: 'Another user' };
        optionValues = { name: 'New name', 'new-name': 'Other name', 'new-icon': '🦁' };
        await renameCommand.execute(interaction);
        assert.equal(replies.at(-1).flags, require('discord.js').MessageFlags.Ephemeral);
        assert.equal(fighterHolder.allFighters['0'].name, 'New name');

        interaction.user = { id: 'rename-user', username: 'Rename user' };
        optionValues = { name: 'New name', 'new-name': 'New name', 'new-icon': '🦁' };
        const originalSaveFighters = barracks.SaveFighters;
        let saveCount = 0;
        barracks.SaveFighters = function (...args) {
            saveCount++;
            return originalSaveFighters.apply(this, args);
        };
        const replyCountBeforeNoop = replies.length;
        const historyBeforeNoop = structuredClone(fighterHolder.allFighters['0'].identityHistory);
        try {
            await renameCommand.execute(interaction);
        }
        finally {
            barracks.SaveFighters = originalSaveFighters;
        }
        assert.equal(replies.length, replyCountBeforeNoop + 1);
        assert.equal(replies.at(-1).flags, require('discord.js').MessageFlags.Ephemeral);
        assert.match(replies.at(-1).content, /nothing changed/i);
        assert.equal(saveCount, 0);
        assert.deepEqual(fighterHolder.allFighters['0'].identityHistory, historyBeforeNoop);

        await fighterHistoryCommand.execute(interaction);
        assert.deepEqual(replies.at(-1).allowedMentions, { parse: [] });
        assert.match(replies.at(-1).content, /Current identity: 🦁 \*\*New name\*\*/);
        assert.match(replies.at(-1).content, /🐉 \*\*Old name\*\*/);
        assert.match(replies.at(-1).content, /🦁 \*\*Old name\*\*/);
        assert.match(replies.at(-1).content, /🦁 \*\*Changed\*\*/);

        const savedHolder = JSON.parse(fs.readFileSync(path.join(guildDirectory, 'fighters.json'), 'utf8'));
        assert.equal(savedHolder.allFighters['0'].identityHistory[0].name, 'Old name');
        assert.equal(savedHolder.allFighters['0'].identityHistory[0].icon, '🐉');
        assert.equal(savedHolder.allFighters['0'].identityHistory.length, 3);
    });
});
