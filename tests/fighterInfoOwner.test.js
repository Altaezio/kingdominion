const assert = require('node:assert/strict');
const test = require('node:test');

test('fighter-info displays the fighter owner instead of the command user', async () => {
    const modulePaths = [
        require.resolve('../source/barracks.js'),
        require.resolve('../source/arenaManager.js'),
        require.resolve('../source/userHandler.js'),
        require.resolve('../source/modifierManager.js'),
        require.resolve('../source/modifierLocalizations.js'),
    ];
    const originalModules = new Map(modulePaths.map(modulePath => [modulePath, require.cache[modulePath]]));
    const fighter = {
        id: 1,
        name: 'Alice',
        icon: '🐉',
        userLocalId: 23,
        baseModifierIds: [],
        baseModifierData: {},
    };
    let lookedUpOwnerId;

    function mockModule(modulePath, exports) {
        require.cache[modulePath] = {
            id: modulePath,
            filename: modulePath,
            loaded: true,
            exports,
        };
    }

    mockModule(modulePaths[0], { GetFighterByName: () => fighter });
    mockModule(modulePaths[1], { GetArena: () => null });
    mockModule(modulePaths[2], {
        GetLocalUserByLocalId(userLocalId) {
            lookedUpOwnerId = userLocalId;
            return { name: 'Fighter owner' };
        },
        GetLocalUserByDiscordUser() {
            throw new Error('Should not look up the command user');
        },
    });
    mockModule(modulePaths[3], { GetModifiers: () => ({}) });
    mockModule(modulePaths[4], {});

    const commandPath = require.resolve('../commands/kingdominion/fighter-info.js');
    const originalCommand = require.cache[commandPath];
    delete require.cache[commandPath];

    try {
        const command = require('../commands/kingdominion/fighter-info.js');
        let reply;
        await command.execute({
            locale: 'en-US',
            user: { id: 'command-user' },
            options: {
                getString: () => 'Alice',
                getBoolean: () => false,
            },
            async deferReply() {},
            async editReply(payload) {
                reply = payload.content;
            },
        });

        assert.equal(lookedUpOwnerId, fighter.userLocalId);
        assert.match(reply, /\*\*Fighter owner\*\*/);
        assert.doesNotMatch(reply, /command-user/);
    }
    finally {
        if (originalCommand)
            require.cache[commandPath] = originalCommand;
        else
            delete require.cache[commandPath];
        for (const [modulePath, originalModule] of originalModules) {
            if (originalModule)
                require.cache[modulePath] = originalModule;
            else
                delete require.cache[modulePath];
        }
    }
});
