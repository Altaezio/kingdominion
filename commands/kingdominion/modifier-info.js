const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	category: 'kingdominion',
	data: new SlashCommandBuilder()
		.setName('modifier-info')
		.setDescription('Donne la description complète d\'un modificateur')
		.addStringOption(option =>
			option.setName('modifier')
				.setDescription('Identifiant du modificateur')
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const modifierManager = require('../../source/modifierManager.js');
		const tagManager = require('../../source/tagManager.js');
		const modifierLocalizations = require('../../source/modifierLocalizations.js');
		const { Text } = require('../../source/commandLocalizations.js');
		const modifierId = interaction.options.getString('modifier');
		const modifier = modifierManager.GetModifier(modifierId);
		if (!modifier) {
			await interaction.editReply({ content: Text(interaction, 'modifier-info', 'notFound', { id: modifierId }) });
			return;
		}

		const directTags = modifier.tags ?? [];
		const allTags = [...tagManager.GetAllTags(directTags)];
		let description = `**${modifierLocalizations.GetName(modifier.id, interaction.locale)}**\n`;
		description += `${Text(interaction, 'modifier-info', 'id')} : \`${modifier.id}\`\n`;
		description += `${Text(interaction, 'modifier-info', 'type')} : **${modifier.type}**\n`;
		description += `${Text(interaction, 'modifier-info', 'description')} : ${modifierLocalizations.GetDescription(modifier.id, interaction.locale)}`;
		description += `\n${Text(interaction, 'modifier-info', 'tags')} : ${allTags.length > 0 ? allTags.map(tag => `\`${tag}\``).join(', ') : Text(interaction, 'modifier-info', 'none')}`;

		if (modifier.defaultData) {
			description += `\n${Text(interaction, 'modifier-info', 'defaultData')} :\n\`\`\`json\n${JSON.stringify(modifier.defaultData, null, 2)}\n\`\`\``;
		}

		await interaction.editReply({ content: description });
	},
};