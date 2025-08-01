const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userHandler = require('../../source/userHandler.js');
const barracks = require('../../source/barracks.js');
const modifierManager = require('../../source/modifierManager.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('fighter-info')
        .setDescription('Donne les info sur ton combattant')
        .setStringOption(option =>
            option.setName('name')
                .setDescription('Le nom de ton combattant')
                .setMinLength(3)
                .setRequired(true)
        ),
    async execute(interaction) {
        const fighter = barracks.GetFighterByName(interaction.options.getString('name'));
        const user = userHandler.GetLocalUserByAccountId(interaction.user.id);
        let modifiersText = `Ce combattant a ${fighter.modifierIds.length} modificateurs`;
        fighter.modifierIds.forEach(modId => {
            const mod = modifierManager.loadedModifiers[modId];
            modifiersText.concat(`\n - ${mod.name} (${mod.type}), ${mod.description}.`); // TODO:: ask for a description
            if (mod.hasOwnProperty('defaultData')) {
                const dataKeys = Object.keys(fighter.modifierData[modId]);
                dataKeys.forEach(key => {
                    modifiersText.concat(` ${key}: ${fighter.modifierData[modId][key]}.`);
                });
            }
        });
        await interaction.reply({ content: `Nom : ${fighter.name}\nJoueur : ${user.name}\n${modifiersText}` });
    },
};