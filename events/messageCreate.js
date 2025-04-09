const { Events, MessageFlags } = require('discord.js');
const { clientId } = require('../config.json');

module.exports = {
    name: Events.MessageCreate,
    execute(message) {
        if (message.author.id == clientId)
            return;
    },
}
