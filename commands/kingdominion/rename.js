const { MessageFlags, SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('rename')
        .setDescription('Change the name and icon of one of your fighters.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of your fighter.')
                .setMinLength(3)
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('new-name')
                .setDescription('The fighter’s new name.')
                .setMinLength(3)
                .setMaxLength(10)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('new-icon')
                .setDescription('The fighter’s new emoji icon.')
                .setMinLength(1)
                .setMaxLength(1999)
                .setRequired(true)
        ),
    async execute(interaction) {
        const { Text } = require('../../source/commandLocalizations.js');
        const userHandler = require('../../source/userHandler.js');
        const barracks = require('../../source/barracks.js');
        const { GetFirstEmoji } = require('../../source/emojiUtils.js');
        const fighterName = interaction.options.getString('name').trim();
        const newName = interaction.options.getString('new-name').trim();
        const iconOption = interaction.options.getString('new-icon');
        const newIcon = GetFirstEmoji(iconOption);

        if (newName.length < 3 || newName.length > 10) {
            await interaction.reply({
                content: Text(interaction, 'rename', 'invalidName'),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        if (!newIcon) {
            await interaction.reply({
                content: Text(interaction, 'rename', 'invalidIcon', { icon: iconOption }),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const user = userHandler.GetLocalUserByDiscordUser(interaction.user);
        const fighter = barracks.GetFightersForUser(user.id)
            .find(candidate => candidate.name === fighterName);

        if (!fighter) {
            await interaction.reply({
                content: Text(interaction, 'rename', 'fighterNotFound', { name: fighterName }),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        if (fighter.name === newName && fighter.icon === newIcon) {
            await interaction.reply({
                content: Text(interaction, 'rename', 'noChange'),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        if (barracks.NameIsTaken(newName, fighter.id)) {
            await interaction.reply({
                content: Text(interaction, 'rename', 'nameTaken', { name: newName }),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        const oldName = fighter.name;
        const oldIcon = fighter.icon;
        if (!barracks.RenameFighter(fighter.id, newName, newIcon)) {
            await interaction.reply({
                content: Text(interaction, 'rename', 'failed'),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.reply({
            content: Text(interaction, 'rename', 'renamed', {
                oldName,
                oldIcon,
                newName,
                newIcon,
            }),
            allowedMentions: { parse: [] },
        });
    },
    async autocomplete(interaction) {
        const userHandler = require('../../source/userHandler.js');
        const barracks = require('../../source/barracks.js');
        const user = userHandler.GetLocalUserByDiscordUser(interaction.user);
        const focusedValue = interaction.options.getFocused().toLocaleLowerCase();
        const choices = barracks.GetFightersForUser(user.id)
            .filter(fighter => fighter.name.toLocaleLowerCase().includes(focusedValue))
            .slice(0, 25)
            .map(fighter => ({
                name: `${fighter.icon} ${fighter.name}`,
                value: fighter.name,
            }));
        await interaction.respond(choices);
    },
};
