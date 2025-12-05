const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause la partie en cours (/run pour la relancer)'),
    async execute(interaction) {
        const jobName = 'runningGame';
        const gameIsRunning = schedule.scheduledJobs.hasOwnProperty(jobName);
        if (gameIsRunning) {
            schedule.scheduledJobs[jobName].cancel();
            await interaction.reply({ content: 'Jeu mis en pause' });
        }
        else {
            await interaction.reply({ content: 'Jeu pas en cours', flags: MessageFlags.Ephemeral });
        }
    },
};