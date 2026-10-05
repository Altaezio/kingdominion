const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const arenaManager = require('../source/arenaManager.js');
const discordGameAdapter = require('../source/discordGameAdapter.js');
const guildData = require('../source/guildData.js');

test('Discord output localizes, records, and selectively delivers game logs', async t => {
    const guildId = `902${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
    const sentMessages = [];
    const channel = {
        async send(message) {
            sentMessages.push(message);
        },
    };
    t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

    await guildData.run(guildId, async () => {
        arenaManager.ResetArena();
        const output = discordGameAdapter.CreateOutput(channel, 'en');

        await output.log({ key: 'combatStart', values: { seed: 'test-seed' } }, { useConsole: false });
        await output.log({ key: 'beginningOfTurn' }, { sendToChannel: false });

        assert.deepEqual(sentMessages, [{ content: 'Let the games begin! Seed: test-seed' }]);
        assert.deepEqual(arenaManager.GetArena().log.map(entry => entry.replace(/^\[[^\]]+\]: /, '')), [
            'Let the games begin! Seed: test-seed',
            'Beginning of turn',
        ]);
        assert.ok(arenaManager.GetArena().log.every(entry => /^\[[^\]]+\]: /.test(entry)));
    });
});
