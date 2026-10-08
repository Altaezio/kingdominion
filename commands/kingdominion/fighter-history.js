const { MessageFlags, SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('fighter-history')
        .setDescription('Shows the previous names and icons of a fighter.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The fighter whose history you want to see.')
                .setMinLength(3)
                .setAutocomplete(true)
                .setRequired(true)
        ),
    async execute(interaction) {
        const barracks = require('../../source/barracks.js');
        const { Text } = require('../../source/commandLocalizations.js');
        const fighterName = interaction.options.getString('name').trim();
        const fighter = Object.values(barracks.GetFighterHolder().allFighters)
            .find(candidate => candidate.name === fighterName);

        if (!fighter) {
            await interaction.reply({
                content: Text(interaction, 'fighter-history', 'notFound', { name: fighterName }),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const lines = [
            Text(interaction, 'fighter-history', 'header', { icon: fighter.icon, name: fighter.name }),
        ];
        const history = fighter.identityHistory ?? [];
        if (history.length === 0) {
            lines.push(Text(interaction, 'fighter-history', 'noHistory'));
        }
        else {
            lines.push(Text(interaction, 'fighter-history', 'previous'));
            const previousEntries = [...history].reverse().map(entry =>
                Text(interaction, 'fighter-history', 'entry', {
                    icon: entry.icon,
                    name: entry.name,
                    date: new Date(entry.changedAt).toLocaleString(interaction.locale),
                })
            );
            let includedEntries = [];
            for (const entry of previousEntries) {
                const candidateLines = [...lines, ...includedEntries, entry];
                if (candidateLines.join('\n').length > 1900)
                    break;
                includedEntries.push(entry);
            }
            lines.push(...includedEntries);
            const omittedCount = previousEntries.length - includedEntries.length;
            if (omittedCount > 0)
                lines.push(Text(interaction, 'fighter-history', 'older', { count: omittedCount }));
        }

        await interaction.reply({
            content: lines.join('\n'),
            allowedMentions: { parse: [] },
            flags: MessageFlags.Ephemeral
        });
    },
    async autocomplete(interaction) {
        const barracks = require('../../source/barracks.js');
        const focusedValue = interaction.options.getFocused().toLocaleLowerCase();
        const choices = Object.values(barracks.GetFighterHolder().allFighters)
            .filter(fighter => fighter.name.toLocaleLowerCase().includes(focusedValue))
            .slice(0, 25)
            .map(fighter => ({
                name: `${fighter.icon} ${fighter.name}`,
                value: fighter.name,
            }));
        await interaction.respond(choices);
    },
};
