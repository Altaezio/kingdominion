const fs = require('node:fs');

module.exports = {
    GetConfig() {
        return JSON.parse(fs.readFileSync(`./config.json`, 'utf8'));
    },

    GetLocalUserByAccountId(userId) {
        const config = this.GetConfig();
        if (!config.users.hasOwnProperty(userId)) {
            config.users[userId] = {
                'id': config.nextUserNumber,
                'name': 'user' + config.nextUserNumber
            };
            config.nextUserNumber++;
            const data = JSON.stringify(config, null, 4);
            fs.writeFileSync(`./config.json`, data);
            {
                const currentTime = new Date();
                console.log('[' + currentTime.toLocaleString('fr-FR') + `]: New user created ${userId} to ${config.users[userId]}`);
            }
        }
        return config.users[userId];
    },

    GetLocalUserByLocalName(userName) {
        const config = this.GetConfig();
        const user = config.users.find(e => e.name === userName);
        console.assert(user !== undefined, `User with name ${userName} was not found in config users`);
        return user;
    },

    GetLocalUserByLocalId(userLocalId) {
        const config = this.GetConfig();
        const foundId = Object.keys(config.users).find(id => id === userLocalId);
        console.assert(foundId !== undefined, `User with local id ${userLocalId} was not found in config users`);
        const user = config.users[foundId];
        console.assert(user !== undefined, `User with local id ${userLocalId} was not found in config users`);
        return user;
    },

    GetUserAccountIdByLocalName(userName) {
        const config = this.GetConfig();
        const userId = Object.keys(config.users).find(id => config.users[id].name === userName);
        console.assert(userId !== undefined, `User with name ${userName} was not found in config users`);
        return userId;
    },

    GetUserAccountIdByLocalId(userLocalId) {
        const config = this.GetConfig();
        const userId = Object.keys(config.users).find(id => config.users[id].id === userLocalId);
        console.assert(userId !== undefined, `User with local id ${userLocalId} was not found in config users`);
        return userId;
    },
}
