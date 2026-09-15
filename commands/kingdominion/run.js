const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');
const fs = require('node:fs');
const { detailedLogsChannelId, locale } = require('../../settings.json');
const { sleep, ShuffleInPlace } = require('../../utils.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Commence les jeux !'),
    async execute(interaction) {
        await interaction.reply({ content: 'Scheduling game', flags: MessageFlags.Ephemeral });

        const channel = interaction.client.channels.cache.get(detailedLogsChannelId);

        // one day = one combat, only from Monday to Friday starting at 8am
        const job = schedule.scheduleJob('runningGame', '0 8 * * 1-5', async function () {
            await RunCombat(channel)
        });

        // TODO start job every week-end to gather votes
    },

    async RunCombat(channel) {
        const barrack = require('../../source/barracks.js');
        const arenaManager = require('../../source/arenaManager.js');
        const modifierManager = require('../../source/modifierManager.js');
        const eventTextConstructor = require('../../source/eventTextConstructor.js');

        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + ']: Load data');
        }
        barrack.LoadAllFighters();
        arenaManager.LoadArena('currentArena');
        modifierManager.LoadModifiers();

        let arena = arenaManager.GetArena();
        if (arena.paused) {
            arenaManager.Log('Combat déjà en pause. /pause pour le relancer ou /stop pour l\'arrêter', true, channel, MessageFlags.Ephemeral);
            return;
        }

        const fighterHolder = barrack.GetFighterHolder();
        const fightersIds = Object.keys(fighterHolder.allFighters);

        if (arenaManager.GetState() === 'initialisation') {
            try {
                // reset map
                arenaManager.ResetArena();

                let nFighters = fightersIds.length;
                if (nFighters < 2) {
                    arenaManager.Log(`Not enough fighters to start (${nFighters})`, true, channel, MessageFlags.Ephemeral)
                    return;
                }

                justStarted = true;
                await arenaManager.Log('Que les jeux commencent !', true, channel);

                // give fighters positions
                const spawnPoints = arenaManager.GetSpawnPositions(nFighters);
                for (let i = 0; i < nFighters; i++) {
                    const fighterId = fightersIds[i]
                    const fighter = fighterHolder.allFighters[fighterId]
                    arenaManager.AddFighter(fighter, spawnPoints[i]);
                }
                await arenaManager.Log(`Départ :\n${arenaManager.GetMapVisualisation()}`, false, channel);
                arenaManager.SetState("battling");

            }
            catch (error) {
                console.error('Error : ', error);
                await channel.send(`Error while initialising game :\n\`\`\`${error}\`\`\``);
                return;
            }
        }

        arena = arenaManager.GetArena();
        let failSafe = 1000;
        while (arena.state !== 'finished' && failSafe > 0) {
            if (arena.paused) {
                return;
            }
            try {

                const fighterPositions = {};
                fightersIds.forEach((id) => {
                    const position = arenaManager.GetObjectPosition(id);
                    fighterPositions[id] = position;
                })
                const fightersOnMapIds = Object.keys(fighterPositions);
                console.debug('fighters on map', fightersOnMapIds);

                if (arena.state === 'battling') {
                    arena.turn['fightersOnMapIds'] = fightersOnMapIds;
                    await this.NewTurn(arena.turn, channel);
                    arena = arenaManager.GetArena();
                }

                if (arena.state === 'battling') { // can be stopped during turn
                    // Victory test
                    let fightersPerTeam = {};
                    let fighterAlive = undefined;
                    for (let i = 0; i < fightersIds.length; i++) {
                        const fighter = fighterHolder.allFighters[fightersIds[i]];
                        if (arena.fighterData[fighter.id].isOutOfCombat) {
                            fightersIds.splice(i, 1);
                            i--;
                        }
                        else {
                            fighterAlive = fighter;
                            if (!fightersPerTeam.hasOwnProperty(fighter.currentTeamId))
                                fightersPerTeam[fighter.currentTeamId] = 0;
                            fightersPerTeam[fighter.currentTeamId]++;
                        }
                    }
                    await arenaManager.Log(`Fighters alive : ${fightersIds}`, true);
                    const nTeams = Object.keys(fightersPerTeam).length;
                    if (nTeams < 2) {
                        let msg;
                        if (nTeams === 1) {
                            // WINNER
                            if (fightersPerTeam[0] == 1) {
                                msg = `👑 Bravo à ${barrack.GetFighterFullName(fighterAlive)} pour sa victoire ! 👑`;
                            }
                            else {
                                msg = `👑 Bravo à l'équipe de ${barrack.GetFighterFullName(fighterAlive)} pour sa victoire ! 👑`;
                            }
                        }
                        else if (nTeams === 0) {
                            // EQUALITY
                            msg = `Bravo à personne pour cette égalité`;
                        }
                        await arenaManager.Log(msg, true, channel);
                        arenaManager.SetState('finished');
                        const currentTime = new Date();
                        arenaManager.SaveArena(`${currentTime.toLocaleDateString('fr-FR').replaceAll('/', '-')}_currentArena`);
                        arenaManager.ResetArena();
                        return;
                    }
                }

                barrack.SaveFighters();
                arenaManager.SaveArena('currentArena');
            }
            catch (error) {
                console.log('Error : ', error);
                await channel.send(`Error while running game :\n\`\`\`${error}\`\`\`\nPile d'évènement vidée, combat mis en pause. \`/stop\` pour arrêter ce combat`);
                arena.paused = true;
                try {
                    arenaManager.SaveArena('currentArena');
                }
                catch (error) {
                    await channel.send(`Error while saving after crash : \n\`\`\`${error}\`\`\`\\nProgress lost`)
                }
                return;
            }
            failSafe--;
            await sleep(30); // wait 30s between turns
            arenaManager.LoadArena('currentArena');
        }
        if (failSafe == 0) {
            arena.paused = true;
            console.error('[' + currentTime.toLocaleString('fr-FR') + `]: Too many turn loop (increase fail safe if trigger in normal conditions)`);
            await channel.send(`Combat mis en pause: trop de boucles. \`/stop\` pour arrêter ce combat`);
        }
    },

    async NewTurn(turnObject, channel) {
        const barrack = require('../../source/barracks.js');
        const arenaManager = require('../../source/arenaManager.js');
        const modifierManager = require('../../source/modifierManager.js');
        const eventTextConstructor = require('../../source/eventTextConstructor.js');

        const fighterHolder = barrack.GetFighterHolder();

        if (!turnObject.hasOwnProperty('turnOrder') || turnObject.turnOrder.length == 0) {
            // Sort in order of actions
            console.assert(turnObject.hasOwnProperty('fightersOnMapIds'), 'turn object is missing fightersOnMapIds');
            let fightersInOrder = turnObject.fightersOnMapIds.toSpliced(); // copy
            ShuffleInPlace(fightersInOrder);
            turnObject['turnOrder'] = fightersInOrder;
        }
        let fighterOrderTxt = '';
        for (let i = 0; i < turnObject.turnOrder.length; i++) {
            const fighterId = turnObject.turnOrder[i];
            fighterOrderTxt += ` ${barrack.GetFighterFullNameById(fighterId)}`
            if (i < turnObject.turnOrder.length - 1)
                fighterOrderTxt += ' > '
        }

        const eventStack = [];

        // Tell beginning of combat or turn
        if (turnObject.number === 0) {
            await arenaManager.Log(`# --- **Début du combat** ---`, true, channel);
            const beginningOfCombatEvent = {
                type: 'beginningOfCombat'
            };
            eventStack.push(beginningOfCombatEvent);
            await this.ResolveEventStack(eventStack, turnObject.turnOrder, 0, channel);
            turnObject.number++;
        }

        const startTurnText = `## --- Tour **${turnObject.number}** ---`;
        await arenaManager.Log(startTurnText, true, channel);

        await arenaManager.Log(`Ordre d'actions : ${fighterOrderTxt}`, true, channel)

        await arenaManager.Log("Beginning of turn event", true);
        const beginningOfTurnEvent = {
            type: 'beginningOfTurn'
        }
        eventStack.push(beginningOfTurnEvent);
        await this.ResolveEventStack(eventStack, turnObject.turnOrder, 0, channel);

        const arena = arenaManager.GetArena();

        // Find and execute fighters actions
        for (let i = turnObject.currentTurnTakerInd; i < turnObject.turnOrder.length; i++) {
            if (arena.state !== 'battling' || arena.paused) {
                return;
            }

            const fighterId = turnObject.turnOrder[i];
            const fighter = fighterHolder.allFighters[fighterId];

            if (arena.fighterData[fighter.id].isOutOfCombat)
                continue;

            turnObject.currentTurnTakerInd = i;
            await arenaManager.Log(`> Action de ${barrack.GetFighterFullName(fighter)}`, true, channel);

            // Gather what info they want
            console.log('Gather wanted info');
            let info = {};
            arena.fighterData[fighterId].modifierIds.forEach(modId => {
                modifierManager.GetModifier(modId).GatherWantedInfo(info);
            });
            console.debug('Wanted info:', info);

            // Gather the info wanted
            console.log('Gather actual info');
            arena.fighterData[fighterId].modifierIds.forEach(modId => {
                modifierManager.GetModifier(modId).GatherInfo(barrack, fighterId, arenaManager, info);
            });
            console.debug('Gathered info:', info);

            // Get the commands and instructions
            console.log('Get the commands and instructions');
            let commands = [];
            let instructions = [];
            arena.fighterData[fighterId].modifierIds.forEach(modId => {
                const mod = modifierManager.GetModifier(modId);
                if (mod.type === "action") {
                    let command = mod.GetCommand(barrack, fighterId, arenaManager, info);
                    console.assert(command.hasOwnProperty("type"), `Command does not have a type`);
                    if (command.type === "actionCommand") {
                        commands.push(command);
                    } else {
                        console.assert(command.type === "instruction", `Command type \'${command.type}\' is not supported`);
                        instructions.push(command);
                    }
                }
            });
            console.debug('Commands after adding actions :', commands);
            console.debug('Instructions :', instructions);

            // Get the move commands based on the instructions
            console.log('Get move commands');
            instructions.forEach(instruction => {
                const totalWeightToShare = instruction.weight;
                const firstNewInstructionInd = commands.length;
                arena.fighterData[fighterId].modifierIds.forEach(modId => {
                    if (modifierManager.GetModifier(modId).type === "move") {
                        let moveCommand = modifierManager.GetModifier(modId).GetCommand(barrack, fighterId, arenaManager, info, instruction);
                        if (moveCommand !== undefined)
                            commands.push(moveCommand);
                    }
                });
                const commandsAdded = commands.length - firstNewInstructionInd;
                if (commandsAdded > 0) {
                    const newCommandWeight = totalWeightToShare / commandsAdded;
                    for (let i = firstNewInstructionInd; i < commands.length; i++) {
                        commands[i].weight = newCommandWeight;
                    }
                }

            });
            // console.debug('Commands after adding moves :', commands);

            // select one command  
            console.log('Select one command');
            let totalWeight = 0;
            commands.forEach(command => {
                totalWeight += command.weight;
            });
            const pickedWeight = Math.random() * totalWeight;
            totalWeight = 0;
            const commandInd = commands.findIndex(command => {
                totalWeight += command.weight;
                return totalWeight >= pickedWeight;
            });
            console.assert(commandInd >= 0, 'A command was not found');
            const pickedCommand = commands[commandInd];
            console.debug('Picked command :', pickedCommand);

            eventStack.push(pickedCommand.resultingEvent);

            // Process all events
            await this.ResolveEventStack(eventStack, turnObject.turnOrder, i, channel);

            // End state visualisation
            await arenaManager.Log(`Après action de ${barrack.GetFighterFullName(fighter)} :\n${arenaManager.GetMapVisualisation()}`, false, channel);
            await sleep(30); // wait 30s between actions
        }
        turnObject.number++;
        turnObject.turnOrder = [];
        turnObject.currentTurnTakerInd = 0;
        arena.turn = turnObject;
    },

    async ResolveEventStack(eventStack, fightersInOrder, turnTakerInd, channel) {

        const barrack = require('../../source/barracks.js');
        const arenaManager = require('../../source/arenaManager.js');
        const modifierManager = require('../../source/modifierManager.js');
        const eventTextConstructor = require('../../source/eventTextConstructor.js');

        const fighterHolder = barrack.GetFighterHolder();
        const arena = arenaManager.GetArena();

        console.log('Process', eventStack.length, 'events');
        let failSafe = 1000;
        while (eventStack.length > 0 && failSafe > 0) {
            failSafe--;
            const event = eventStack.pop();

            if (!event.hasOwnProperty('timing'))
                event.timing = 'before';

            console.log('Process event', event.type);

            // first the target if any
            if (event.hasOwnProperty('target')) {
                const fighterId = event.target;
                arena.fighterData[fighterId].modifierIds.forEach(modId => {
                    const mod = modifierManager.GetModifier(modId);
                    mod.ProcessEvent(barrack, event.target, arenaManager, event);
                });
            }

            // then all the others
            for (let i = 0; i < fightersInOrder.length; i++) {
                let otherFighterId = fightersInOrder[(turnTakerInd + i) % fightersInOrder.length];
                if (!event.hasOwnProperty('target') || otherFighterId != event.target) {
                    arena.fighterData[otherFighterId].modifierIds.forEach(modId => {
                        const mod = modifierManager.GetModifier(modId);
                        mod.ProcessEvent(barrack, otherFighterId, arenaManager, event);
                    });
                }

            }

            if (event.timing === 'during') {
                const text = eventTextConstructor.GetEventText(event, locale, 'detailed');
                if (text && text.length > 0) {
                    await arenaManager.Log(text, true, channel);
                }
            }

            let consequences = []
            if (event.hasOwnProperty('consequences') && event.consequences.length > 0)
                consequences = structuredClone(event.consequences);

            arenaManager.RecordEvent(event, arena.turn.number);

            if (event.timing === 'before') {
                event.timing = 'during';
                event.consequences = [];
                eventStack.push(event);
            }

            consequences.forEach(consequence => {
                eventStack.push(consequence);
            });
        }
        console.assert(failSafe > 0, 'Infinite loop or too many events');
        console.assert(eventStack.length === 0, 'Not all events were processed');
    }
};