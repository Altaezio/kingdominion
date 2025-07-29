const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Starts the game'),
    async execute(interaction) {
        const alreadyRunning = schedule.scheduledJobs.includes('runningGame');
        if (alreadyRunning) {
            await interaction.reply({ content: 'Game already running', flags: MessageFlags.Ephemeral });
            return;
        }

        const job = schedule.scheduleJob('runningGame', '0 * * * *', async function () {
            const barrack = require('../../source/barracks.js');
            const arena = require('../../source/arena.js');
            const modifierManager = require('../../source/modifierManager.js');

            barrack.LoadAllFighters();
            arena.LoadMap();
            modifierManager.LoadModifiers();

            const fighters = barrack.GetFighters();
            const fightersIds = Object.keys(fighters);
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
                    arena.AddObjectsToPosition(fightersIds[i], spawnPoints[i]);
                }
                arena.SetState("battling");
            }

            if (arena.GetState() == "battling") {
                // Gather what info they want
                let info = {};
                fightersIds.forEach(fighterId => {
                    fighters[fighterId].modifierIds.forEach(modId => {
                        modifierManager[modId].GatherWantedInfo(info);
                    });
                });

                // Gather the info wanted
                fightersIds.forEach(fighterId => {
                    fighters[fighterId].modifierIds.forEach(modId => {
                        modifierManager[modId].GatherInfo(barrack, fighterId, arena, info);
                    });
                });

                // Get the commands and instructions
                let commands = {};
                let instructions = {};
                fightersIds.forEach(fighterId => {
                    fighters[fighterId].modifierIds.forEach(modId => {
                        const mod = modifierManager[modId];
                        if (mod.type === "action") {
                            let command = mod.GetCommand(barrack, fighterId, arena, info);
                            console.assert(command.hasOwnProperty(type), `Command does not have a type`);
                            if (command.type === "command") {
                                commands[fighterId].concat(command);
                            } else {
                                console.assert(command.type === "instruction", `Command type \'${command}\' is not supported`);
                                instructions[fighterId].concat(command);
                            }
                        }
                    });
                });

                // Get the move commands based on the instructions

                // select one command per fighter 

                // apply the selected commands in order
                // Command order : action then move ??
            }

            barrack.SaveFighters();
            arena.SaveMap();
        });
    },
};
