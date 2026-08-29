const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrête le combat en cours'),
    async execute(interaction) {
        await interaction.deferReply();
        const arenaManager = require('../../source/arenaManager.js');
        const arena = arenaManager.GetArena();
        arenaManager.SetState('finished'); // 'stopped' instead ?
        arenaManager.SaveArena('currentArena');
    },
};