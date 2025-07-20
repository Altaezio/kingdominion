module.exports = {
    GetLocalUserByAccountId(userId) {
        const config = require('../config.json');
        if (config.users.hasOwnProperty(userId)) {
            return config.users[userId];
        }
        else {
            config.users[userId] = {
                'id': nextUserNumber,
                'name': 'user' + nextUserNumber
            };
            nextUserNumber++;
            const data = JSON.stringify(config, null, 4);
            fs.writeFileSync('./config.json', data);
            {
                const currentTime = new Date();
                console.log('[' + currentTime.toLocaleString('fr-FR') + `]: New user created ${userId} to ${config.users[userId]}`);
            }
            return config.users[userId];
        }
    },

    GetLocalUserByLocalName(userName) {
        const config = require('../config.json');
        const user = config.users.find(e => e.name === userName);
        console.assert(user !== undefined, `User with name ${userName} was not found in config users`);
        return user;
    },

    GetLocalUserByLocalId(userLocalId) {
        const config = require('../config.json');
        const user = config.users.find(e => e.id === userLocalId);
        console.assert(user !== undefined, `User with local id ${userLocalId} was not found in config users`);
        return user;
    },

    GetUserAccountIdByLocalName(userName) {
        const config = require('../config.json');
        const userId = Object.keys(config.users).find(key => config.users[key].name === userName);
        console.assert(userId !== undefined, `User with name ${userName} was not found in config users`);
        return userId;
    },

    GetUserAccountIdByLocalId(userLocalId) {
        const config = require('../config.json');
        const userId = Object.keys(config.users).find(key => config.users[key].id === userLocalId);
        console.assert(userId !== undefined, `User with local id ${userLocalId} was not found in config users`);
        return userId;
    },
}
