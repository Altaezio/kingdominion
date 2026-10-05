const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');
const discordGameAdapter = require('../../source/discordGameAdapter.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause ou dépause le combat en cours')
        .addBooleanOption(option =>
            option.setName('toggle')
                .setDescription('Toggle pour être sûr de l\'état')
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const { Text } = require('../../source/commandLocalizations.js');
        const guildData = require('../../source/guildData.js');
        const arenaManager = require('../../source/arenaManager.js');
        const arena = arenaManager.GetArena();
        const paused = interaction.options.getBoolean('toggle') ?? !arena.paused;
        arena.paused = paused;
        arenaManager.SaveArena('currentArena');
        if (paused) {
            await interaction.editReply({ content: Text(interaction, 'pause', 'paused') });
        }
        else {
            const { testChannelId } = guildData.getSettings();
            const channel = interaction.client.channels.cache.get(testChannelId ?? interaction.channelId);
            discordGameAdapter.RunCombat(channel);
            await interaction.editReply({ content: Text(interaction, 'pause', 'resumed') });
        }
    },
};