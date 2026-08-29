const fs = require('node:fs');

module.exports = {
    GetConfig() {
        return JSON.parse(fs.readFileSync(`./config.json`, 'utf8'));
    },

    GetLocalUserByDiscordUser(user) {
        const config = this.GetConfig();
        if (!config.users.hasOwnProperty(user.id)) {
            config.users[user.id] = {
                'id': config.nextUserNumber,
                'name': user.globalName
            };
            config.nextUserNumber++;
            const data = JSON.stringify(config, null, 4);
            fs.writeFileSync(`./config.json`, data);
            {
                const currentTime = new Date();
                console.log('[' + currentTime.toLocaleString('fr-FR') + `]: New user created ${user.id} to ${config.users[user.id]}`);
            }
        }
        return config.users[user.id];
    },

    GetLocalUserByLocalName(userName) {
        const config = this.GetConfig();
        const user = config.users.find(e => e.name === userName);
        console.assert(user !== undefined, `User with name ${userName} was not found in config users`);
        return user;
    },

    GetLocalUserByLocalId(userLocalId) {
        const config = this.GetConfig();
        const foundId = Object.keys(config.users).find(id => config.users[id].id === userLocalId);
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
