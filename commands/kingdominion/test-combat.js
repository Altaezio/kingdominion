const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const main = require('./run.js');
const { testChannelId } = require('../../settings.json');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('test-combat')
        .setDescription('Commence les jeux !')
        .addStringOption(option =>
            option.setName('seed')
                .setDescription('Seed du combat pour le rendre reproductible')
                .setMinLength(1)
                .setMaxLength(100)
        ),
    async execute(interaction) {
        const { Text } = require('../../source/commandLocalizations.js');
        await interaction.reply({ content: Text(interaction, 'test-combat', 'starting'), flags: MessageFlags.Ephemeral });

        const channel = interaction.client.channels.cache.get(testChannelId);
        const seed = interaction.options.getString('seed');
        main.RunCombat(channel, seed);
    }
};