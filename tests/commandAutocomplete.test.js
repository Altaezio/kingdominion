const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const interactionCreate = require('../events/interactionCreate.js');
const fighterInfo = require('../commands/kingdominion/fighter-info.js');
const modifierInfo = require('../commands/kingdominion/modifier-info.js');
const retire = require('../commands/kingdominion/retire.js');
const barracks = require('../source/barracks.js');
const guildData = require('../source/guildData.js');

test('autocomplete routes to the correct fighter and modifier suggestions', async t => {
    const guildId = `903${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
    t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

    await guildData.run(guildId, async () => {
        barracks.LoadAllFighters();
        const fighterHolder = barracks.GetFighterHolder();
        fighterHolder.allFighters = {
            '0': { id: 0, name: 'Alice', icon: '🐉', userLocalId: 1 },
            '1': { id: 1, name: 'Old Alice', icon: '🦊', userLocalId: 1, isRetired: true },
            '2': { id: 2, name: 'Ally', icon: '🐻', userLocalId: 2 },
        };
        fighterHolder.nextId = 3;
        barracks.SaveFighters();

        const commands = new Map([
            ['fighter-info', fighterInfo],
            ['modifier-info', modifierInfo],
            ['retire', retire],
        ]);

        async function autocomplete(commandName, focusedValue, locale = 'en-US') {
            let choices;
            await interactionCreate.execute({
                guildId,
                commandName,
                locale,
                user: { id: 'autocomplete-user', username: 'Autocomplete user' },
                client: { commands },
                options: { getFocused: () => focusedValue },
                isStringSelectMenu: () => false,
                isAutocomplete: () => true,
                isChatInputCommand: () => false,
                async respond(result) {
                    choices = result;
                },
            });
            return choices;
        }

        const fighterChoices = await autocomplete('fighter-info', 'al');
        assert.deepEqual(fighterChoices.map(choice => choice.value), ['Alice', 'Old Alice', 'Ally']);

        const retireChoices = await autocomplete('retire', 'al');
        assert.deepEqual(retireChoices.map(choice => choice.value), ['Alice']);

        const modifierChoices = await autocomplete('modifier-info', 'vie', 'fr-FR');
        assert.ok(modifierChoices.some(choice => choice.value === 'health' && choice.name.includes('Vie')));
    });
});
