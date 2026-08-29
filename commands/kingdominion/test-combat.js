const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const main = require('../utility/run.js');
const { testChannelId } = require('../../settings.json');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Commence les jeux !'),
    async execute(interaction) {
        await interaction.reply({ content: 'Starting one combat', flags: MessageFlags.Ephemeral });

        const channel = interaction.client.channels.cache.get(testChannelId);
        main.RunCombat(channel);
    }
};