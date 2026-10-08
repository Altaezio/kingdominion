const { MessageFlags, SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('retire')
        .setDescription('Retires one of your fighters.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of your fighter.')
                .setMinLength(3)
                .setAutocomplete(true)
                .setRequired(true)
        ),
    async execute(interaction) {
        const { Text } = require('../../source/commandLocalizations.js');
        const userHandler = require('../../source/userHandler.js');
        const barracks = require('../../source/barracks.js');
        const fighterName = interaction.options.getString('name').trim();
        const user = userHandler.GetLocalUserByDiscordUser(interaction.user);
        const fighter = barracks.GetFightersForUser(user.id)
            .find(candidate => candidate.name === fighterName);

        if (!fighter) {
            await interaction.reply({
                content: Text(interaction, 'retire', 'notFound', { name: fighterName }),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        barracks.RetireFighter(fighter.id);
        await interaction.reply({
            content: Text(interaction, 'retire', 'retired', { name: fighter.name }),
            flags: MessageFlags.Ephemeral,
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
