const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');
const main = require('./run.js');
const { testChannelId } = require('../../settings.json');

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
        const arenaManager = require('../../source/arenaManager.js');
        const arena = arenaManager.GetArena();
        const paused = interaction.options.getBoolean('toggle') ?? !arena.paused;
        arena.paused = paused;
        arenaManager.SaveArena('currentArena');
        if (paused) {
            await interaction.editReply({ content: "Combat mis en pause" });
        }
        else {
            const channel = interaction.client.channels.cache.get(testChannelId);
            main.RunCombat(channel);
            await interaction.editReply({ content: "Combat relancé" });
        }
    },
};