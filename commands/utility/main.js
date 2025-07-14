const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Starts the game'),
    async execute(interaction) {
        const alreadyRunning = schedule.scheduledJobs.includes('running-game');
        if (alreadyRunning) {
            await interaction.reply({ content: 'Game already running', flags: MessageFlags.Ephemeral });
            return;
        }

        const job = schedule.scheduleJob('running-game', '0 * * * *', async function () {
            const barrack = require('../../source/barracks.js');
            const arena = require('../../source/arena.js');

            const fighters = barrack.GetFighters();
            const nFighters = fighters.length;
            if (nFighters < 2) {
                await interaction.reply({ content: `Not enough fighters (${nFighters})`, flags: MessageFlags.Ephemeral });
                return;
            }

            interaction.reply({ content: 'Do the battle' });

            if (arena.GetState() == "initialisation") {
                // give fighters positions
                const spawnPoints = arena.GetSpawnPositions(nFighters);
                for (let i = 0; i < nFighters; i++) {
                    arena.AddObjectsToPosition(fighters[i].id, spawnPoints[i]);
                }
                arena.SetState("battling");
            }

            if (arena.GetState() == "battling") {
                // go through fighters to get their wanted info (??) => GatherInfo

                // give the wanted infos to the fighters and get the commands => 

                // select one command per fighter 

                // apply the selected commands
            }
        });
    },
};
