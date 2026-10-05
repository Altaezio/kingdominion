const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const discordGameAdapter = require('../../source/discordGameAdapter.js');

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
        const { testChannelId } = require('../../source/guildData.js').getSettings();
        await interaction.reply({ content: Text(interaction, 'test-combat', 'starting'), flags: MessageFlags.Ephemeral });

        const channel = interaction.client.channels.cache.get(testChannelId ?? interaction.channelId);
        const seed = interaction.options.getString('seed');
        discordGameAdapter.RunCombat(channel, seed, {
            persistFighterStats: false,
            turnDelaySeconds: 0,
            actionDelaySeconds: 0,
        });
    }
};