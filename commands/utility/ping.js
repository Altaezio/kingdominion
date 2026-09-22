const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        const { Text } = require('../../source/commandLocalizations.js');
        await interaction.reply({ content: Text(interaction, 'ping', 'pong') });
    },
};