const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const guildData = require('../../source/guildData.js');
const gameScheduler = require('../../source/gameScheduler.js');
const { Text } = require('../../source/commandLocalizations.js');

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('run')
		.setDescription('Commence les jeux !'),
	async execute(interaction) {
		await interaction.reply({
			content: Text(interaction, 'run', 'scheduling'),
			flags: MessageFlags.Ephemeral,
		});

		gameScheduler.ScheduleGuildGame(
			interaction.client,
			guildData.getGuildId(),
			guildData.getSettings(),
			interaction.channelId,
		);
	},
};
