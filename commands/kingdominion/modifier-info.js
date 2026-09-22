const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	category: 'kingdominion',
	data: new SlashCommandBuilder()
		.setName('modifier-info')
		.setDescription('Donne la description complete d\'un modificateur')
		.addStringOption(option =>
			option.setName('modifier')
				.setDescription('Identifiant du modificateur')
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const modifierManager = require('../../source/modifierManager.js');
		const tagManager = require('../../source/tagManager.js');
		const modifierId = interaction.options.getString('modifier');
		const modifier = modifierManager.GetModifier(modifierId);
		if (!modifier) {
			await interaction.editReply({ content: `Aucun modificateur trouve avec l'identifiant '${modifierId}'.` });
			return;
		}

		const directTags = modifier.tags ?? [];
		const allTags = [...tagManager.GetAllTags(directTags)];
		let description = `**${modifier.name}**\n`;
		description += `Identifiant : \`${modifier.id}\`\n`;
		description += `Type : **${modifier.type}**\n`;
		description += `Description : ${modifier.description}`;
		description += `\nTags : ${allTags.length > 0 ? allTags.map(tag => `\`${tag}\``).join(', ') : 'Aucun'}`;

		if (modifier.defaultData) {
			description += `\nDonnees par defaut :\n\`\`\`json\n${JSON.stringify(modifier.defaultData, null, 2)}\n\`\`\``;
		}

		await interaction.editReply({ content: description });
	},
};