const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('fighter-list')
        .setDescription('Donne la liste de tous les combattants'),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { Text } = require('../../source/commandLocalizations.js');
        const userHandler = require(`../../source/userHandler.js`);
        const barracks = require(`../../source/barracks.js`);
        const modifierManager = require(`../../source/modifierManager.js`);
        const modifiers = modifierManager.GetModifiers();
        const fighterHolder = barracks.GetFighterHolder();
        let fighterListText = Text(interaction, 'fighter-list', 'header');
        const fighterIds = Object.keys(fighterHolder.allFighters);
        fighterIds.forEach((id) => {
            const fighter = barracks.GetFighterById(id);
            if (fighter) {
                const user = userHandler.GetLocalUserByLocalId(fighter.userLocalId);
                if (user) {
                    fighterListText = fighterListText.concat(Text(interaction, 'fighter-list', 'entry', { icon: fighter.icon, name: fighter.name, player: user.name }));
                }
            }
        });
        await interaction.editReply({ content: fighterListText });
    },
};
