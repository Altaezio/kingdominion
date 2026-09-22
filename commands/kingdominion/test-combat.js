const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const main = require('./run.js');
const { testChannelId } = require('../../settings.json');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('test-combat')
        .setDescription('Commence les jeux !'),
    async execute(interaction) {
        const { Text } = require('../../source/commandLocalizations.js');
        await interaction.reply({ content: Text(interaction, 'test-combat', 'starting'), flags: MessageFlags.Ephemeral });

        const channel = interaction.client.channels.cache.get(testChannelId);
        main.RunCombat(channel);
    }
};