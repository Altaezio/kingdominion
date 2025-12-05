const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');
const fs = require('node:fs');
const { channelId } = require('../../settings.json');
const { ShuffleInPlace } = require('../../utils.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Commence les jeux !'),
    async execute(interaction) {
        const alreadyRunning = schedule.scheduledJobs.hasOwnProperty('runningGame');
        if (alreadyRunning) {
            await interaction.reply({ content: 'Game already running', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.reply({ content: 'Scheduling game', flags: MessageFlags.Ephemeral });
        const job = schedule.scheduleJob('runningGame', '*/10 * * * * *', async function () {
            const channel = interaction.client.channels.cache.get(channelId);

            const barrack = require('../../source/barracks.js');
            const arena = require('../../source/arena.js');
            const modifierManager = require('../../source/modifierManager.js');
            const eventTextConstructor = require('../../source/eventTextConstructor.js');

            try {
                {
                    const currentTime = new Date();
                    console.log('[' + currentTime.toLocaleString('fr-FR') + ']: Load data');
                }
                barrack.LoadAllFighters();
                arena.LoadMap("currentMap");
                modifierManager.LoadModifiers();

                const fighterHolder = barrack.GetFighterHolder();
                const fightersIds = Object.keys(fighterHolder.allFighters);

                if (arena.GetState() === 'initialisation') {
                    let nFighters = fightersIds.length;
                    if (nFighters < 2) {
                        console.log(`Not enough fighters to start (${nFighters})`);
                        channel.send({ content: `Not enough fighters to start (${nFighters})`, flags: MessageFlags.Ephemeral });
                        return;
                    }
                }
                else {
                    let fightersPerTeam = {};
                    let fighterAlive = undefined;
                    for (let i = 0; i < fightersIds.length; i++) {
                        const fighter = fighterHolder.allFighters[fightersIds[i]];
                        if (fighter.isOutOfCombat) {
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
                    const nTeams = Object.keys(fightersPerTeam).length;
                    if (nTeams === 1) {
                        // WINNER
                        console.log(barrack.GetFighterFullName(fighterAlive.id), 'won');
                        channel.send({ content: `Bravo à ${barrack.GetFighterFullName(fighterAlive.id)} pour sa victoire !` });
                        arena.SetState('initialisation');
                        arena.SaveMap('currentMap');
                        job.cancel(); // stopping the schedule for now 
                        return;
                    }
                    else if (nTeams === 0) {
                        // EQUALITY
                        console.log('Draw');
                        channel.send({ content: `Bravo à personne pour cette égalité` });
                        arena.SetState('initialisation');
                        arena.SaveMap('currentMap');
                        job.cancel(); // stopping the schedule for now 
                        return;
                    }
                }

                const nFighters = fightersIds.length;

                let justStarted = false;
                if (arena.GetState() == "initialisation") {
                    const currentTime = new Date();
                    console.log('[' + currentTime.toLocaleString('fr-FR') + ']: Initialisation');
                    justStarted = true;
                    await ({ content: 'Que les jeux commencent !' })
                        .then((message) => {
                            const interactionData = JSON.parse(fs.readFileSync(`./data/interactionData.json`, 'utf8'));
                            interactionData.runCommandMessageId = message.id.toString();
                            const data = JSON.stringify(interactionData, null, 4);
                            fs.writeFileSync('./data/interactionData.json', data);
                        });

                    // reset map
                    arena.GetMap().map = {};

                    // give fighters positions and reset their data
                    const spawnPoints = arena.GetSpawnPositions(nFighters);
                    for (let i = 0; i < nFighters; i++) {
                        const fighterId = fightersIds[i]
                        const fighter = fighterHolder.allFighters[fighterId]
                        arena.AddObjectsToPosition(fighterId, spawnPoints[i]);
                        fighter.isOutOfCombat = false;
                        fighter.modifierIds = fighter.baseModifierIds.toSpliced();
                        fighter.modifierData = structuredClone(fighter.baseModifierData);
                        console.debug(fighter)
                    }
                    console.log('Visualisation of the map');
                    await channel.send({ content: `Départ :\n${arena.GetMapVisualisation()}` });
                    arena.SetState("battling");
                }
                else {
                    const currentTime = new Date();
                    console.log('[' + currentTime.toLocaleString('fr-FR') + ']: New turn');
                }

                const fighterPositions = {};
                fightersIds.forEach((id) => {
                    const position = arena.GetObjectPosition(id);
                    fighterPositions[id] = position;
                })
                const fightersOnMapIds = Object.keys(fighterPositions);
                console.debug('fighters on map', fightersOnMapIds);

                if (arena.GetState() == "battling") {
                    if (justStarted) {
                        const text = '--- Premier tour ---';
                        console.log(text);
                        await channel.send({ content: text });
                    }
                    else {
                        const text = '--- Nouveau tour ---';
                        console.log(text);
                        await channel.send({ content: text }); // TODO count turns
                    }

                    // Sort in order of actions
                    let fightersInOrder = fightersOnMapIds.toSpliced(); // copy
                    ShuffleInPlace(fightersInOrder);
                    let fighterOrderTxt = '';
                    for (let i = 0; i < fightersInOrder.length; i++) {
                        const fighterId = fightersInOrder[i];
                        fighterOrderTxt += ` ${barrack.GetFighterFullName(fighterId)}`
                        if (i < fightersInOrder.length - 1)
                            fighterOrderTxt += ' > '
                    }
                    await channel.send({ content: `Ordre d'actions : ${fighterOrderTxt}` })

                    const eventStack = [];

                    // Tell beginning of combat or turn
                    if (justStarted) {
                        console.log('Beginning of combat event');
                        const beginningOfCombatEvent = {
                            type: 'beginningOfCombat'
                        };
                        eventStack.push(beginningOfCombatEvent);
                        await ResolveEventStack(eventStack, fightersOnMapIds, channel);
                    }

                    console.log("Beginning of turn event");
                    const beginningOfTurnEvent = {
                        type: 'beginningOfTurn'
                    }
                    eventStack.push(beginningOfTurnEvent);
                    await ResolveEventStack(eventStack, fightersOnMapIds, channel);

                    // Find and execute fighters actions
                    for (let i = 0; i < fightersInOrder.length; i++) {

                        const fighterId = fightersInOrder[i];
                        const fighter = fighterHolder.allFighters[fighterId];

                        await channel.send({ content: `> Tour de ${barrack.GetFighterFullName(fighterId)}` });

                        if (fighter.isOutOfCombat)
                            continue;

                        {
                            const currentTime = new Date();
                            console.log(`[${currentTime.toLocaleString('fr-FR')}]:' ${fighter.name}'s turn`);
                        }

                        // Gather what info they want
                        console.log('Gather wanted info');
                        let info = {};
                        fighter.modifierIds.forEach(modId => {
                            modifierManager.GetModifier(modId).GatherWantedInfo(info);
                        });
                        console.debug('Wanted info:', info);

                        // Gather the info wanted
                        console.log('Gather actual info');
                        fighter.modifierIds.forEach(modId => {
                            modifierManager.GetModifier(modId).GatherInfo(barrack, fighterId, arena, info);
                        });
                        console.debug('Gathered info:', info);

                        // Get the commands and instructions
                        console.log('Get the commands and instructions');
                        let commands = [];
                        let instructions = [];
                        fighter.modifierIds.forEach(modId => {
                            const mod = modifierManager.GetModifier(modId);
                            if (mod.type === "action") {
                                let command = mod.GetCommand(barrack, fighterId, arena, info);
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
                            fighter.modifierIds.forEach(modId => {
                                if (modifierManager.GetModifier(modId).type === "move") {
                                    let moveCommand = modifierManager.GetModifier(modId).GetCommand(barrack, fighterId, arena, info, instruction);
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
                        await ResolveEventStack(eventStack, fightersOnMapIds, channel);

                        // End state visualisation
                        console.debug('[DEBUG] map ', arena.GetMap());
                        await channel.send({ content: `Après action de ${barrack.GetFighterFullName(fighterId)} :\n${arena.GetMapVisualisation()}` });
                    }
                }

                barrack.SaveFighters();
                arena.SaveMap('currentMap');
            }
            catch (error) {
                console.log('Error : ', error);
                const interactionData = JSON.parse(fs.readFileSync(`./data/interactionData.json`, 'utf8'));
                const runCommandMessage = channel.messages.fetch(interactionData.runCommandMessageId);
                if (typeof (runCommandMessage) === 'Message') {
                    runCommandMessage.reply({ content: `Error while running game : ${error}`, flags: MessageFlags.Ephemeral });
                    if (arena.GetState() == "initialisation") {
                        job.cancel();
                        runCommandMessage.reply({ content: "Stop job due to an error in initialisation", flags: MessageFlags.Ephemeral });
                    }
                }
                else {
                    await channel.send(`Error while running game : ${error}`);
                    if (arena.GetState() == "initialisation") {
                        job.cancel();
                        await channel.send("Stop job due to an error in initialisation");
                    }
                }
            }
        });
    }
};

async function ResolveEventStack(eventStack, fightersOnMapIds, channel) {

    const barrack = require('../../source/barracks.js');
    const arena = require('../../source/arena.js');
    const modifierManager = require('../../source/modifierManager.js');
    const eventTextConstructor = require('../../source/eventTextConstructor.js');

    const fighterHolder = barrack.GetFighterHolder();

    console.log('Process', eventStack.length, 'events');
    let failSafe = 1000;
    while (eventStack.length > 0 && failSafe > 0) {
        failSafe--;
        const event = eventStack.pop();

        if (!event.hasOwnProperty('timing'))
            event.timing = 'before';

        console.log('Process event', event);

        // first the target if any
        if (event.hasOwnProperty('target')) {
            const fighter = fighterHolder.allFighters[event.target];
            fighter.modifierIds.forEach(modId => {
                const mod = modifierManager.GetModifier(modId);
                mod.ProcessEvent(barrack, event.target, arena, event);
            });
        }

        // then all the others
        fightersOnMapIds.forEach(otherFighterId => {
            if (!event.hasOwnProperty('target') || otherFighterId != event.target) {
                const otherFighter = fighterHolder.allFighters[otherFighterId];
                otherFighter.modifierIds.forEach(modId => {
                    const mod = modifierManager.GetModifier(modId);
                    mod.ProcessEvent(barrack, otherFighterId, arena, event);
                });
            }

        });

        if (event.timing === 'during') {
            const text = eventTextConstructor.GetEventText(event);
            if (text && text.length > 0) {
                console.log(text);
                await channel.send({ content: text });
            }
        }

        let consequences = []
        if (event.hasOwnProperty('consequences') && event.consequences.length > 0)
            consequences = structuredClone(event.consequences);

        if (event.timing !== 'after') {
            if (event.timing === 'before')
                event.timing = 'during';
            else if (event.timing === 'during')
                event.timing = 'after';
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
