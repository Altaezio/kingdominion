const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        const currentTime = new Date();
        console.log(`[${currentTime.toLocaleString('fr-FR')}] Ready! logged in as ${client.user.tag}`);
    },
};