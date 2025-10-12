const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('fighter-info')
        .setDescription('Donne les info sur ton combattant')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Le nom de ton combattant')
                .setMinLength(3)
                .setRequired(true)
        ),
    async execute(interaction) {
        const userHandler = require(`../../source/userHandler.js`);
        const barracks = require(`../../source/barracks.js`);
        const modifierManager = require(`../../source/modifierManager.js`);
        const modifiers = modifierManager.GetModifiers();
        const fighter = barracks.GetFighterByName(interaction.options.getString('name'));
        const user = userHandler.GetLocalUserByAccountId(interaction.user.id);
        let modifiersText = `Ce combattant a ${fighter.modifierIds.length} modificateurs`;
        fighter.modifierIds.forEach(modId => {
            const mod = modifiers[modId];
            modifiersText = modifiersText.concat(`\n - ${mod.name} (${mod.type}), ${mod.description}.`); // TODO:: ask for a description
            if (fighter.modifierData.hasOwnProperty(mod.id)) {
                const dataKeys = Object.keys(fighter.modifierData[mod.id]);
                dataKeys.forEach(key => {
                    modifiersText = modifiersText.concat(` ${key}: ${fighter.modifierData[mod.id][key]}.`);
                });
            }
        });
        await interaction.reply({ content: `${fighter.icon}\nNom : ${fighter.name}\nJoueur : ${user.name} :${modifiersText}` });
    },
};
