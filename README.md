# Base for creating a Discord bot in JS

Made following the guide from the discordjs website: https://discordjs.guide/ 

## To make a new bot based on that

- Fork this project
- **Add the "config.json" file to the ".gitignore"**
- Add your tokens and ids in the "config.json"
- Have or install Node JS
- Launch a terminal at the top level of the project
- Init Node JS with `npm init` (with `-y` if you want the default options)

Your bot should be ready to run and you can modify it to your will

## To run the bot

All the commands are executed at the top level of the project

- Set `testGuildId` in `config.json` to your test server's ID
- Run `node deploy-commands.js --guild` to deploy commands to the test server for fast iteration
- Run `node deploy-commands.js --global` when you are ready to deploy commands to every server
  - These modes are mutually exclusive: guild deployment clears global commands, and global deployment clears commands from the configured test guild
- Run the command `node .` 

Your bot should be online and ready to receive commands and take actions

If you made a change or added a new command, you can use the command `/reload [nameOdTheCommandToReload]`.  
Careful, this command is currently setup as public and anyone can use it.  
You might want it to be deployed as a guild command in a private guild.

## Guild data

Game data is stored separately under `data/guilds/<guildId>/` (fighters, users, arena, survey, and guild settings). This directory is ignored by Git, so users and server state are not committed. The first interaction in a guild initializes its data. Existing data for the guild named by `config.json`'s `guildId` is migrated from the old shared JSON files; keep that ID until the old data has been migrated.

Players can use `/retire name:<fighter>` to retire one of their fighters. The fighter's record and statistics are preserved, but it no longer counts toward the player's active fighter limit or receives future survey modifiers or combat slots. If it is already in a fight, it remains in that fight until it ends.

Players can use `/rename` to change the name and icon of one of their active fighters. The rename announcement is public, and `/fighter-history` lets anyone look up the fighter's previous names and icons.

The `modifierSurveyHistory.json` ledger stores both completed survey choices and consumed modifier IDs.

When a survey closes, fighters without a vote are assigned a random survey option.

When a player joins after completed surveys, `/join` presents an ephemeral button prompt with three catch-up modes: base modifiers only, random modifiers from missed surveys, or choosing one modifier from each missed survey. The prompt is skipped when there are no completed surveys to catch up on.

`config.json` remains local and contains the bot token and application client ID. `testGuildId` identifies the server used for fast guild-scoped command testing. Deploy with `node deploy-commands.js --guild` for the test server or `node deploy-commands.js --global` for every server where the bot is installed. The script clears commands from the other scope to prevent duplicate listings.

Guild-specific channel IDs and settings can be set in `data/guilds/<guildId>/settings.json`. If a channel ID is not configured, game output uses the channel where `/run`, `/survey`, `/pause`, or `/test-combat` was invoked.

## Game execution

The `/run` command delegates recurring jobs to `source/gameScheduler.js`. Combat rules and turn/event resolution live in `source/gameEngine.js`, which receives a small output interface rather than a Discord interaction or channel. `source/discordGameAdapter.js` handles log localization, timestamps, console output, and Discord delivery for scheduled, test, and resumed combats. The arena manager only appends rendered log entries to the arena state.

`RunCombat` accepts `turnDelaySeconds` and `actionDelaySeconds` options (both default to 30 seconds). `/test-combat` sets both to `0` to run without intentional waits.

## Adding a modifier

1. Copy [`source/templates/modifier.js.template`](./source/templates/modifier.js.template) to `source/modifier/<type>/<modifier-id>.js`, where `<type>` is `action`, `passive`, or `move`.
2. Replace `replaceWithUniqueModifierId` with the same unique ID used for the filename.
3. Set the modifier's `type` to match its containing directory. Action and move modifiers must implement `GetCommand` and return the appropriate command or instruction shape; use `source/modifier/action/simpleAttack.js` or `source/modifier/move/simpleCrossMove.js` as examples.
4. Add the modifier's tags and implement its hooks. `GatherWantedInfo`, `GatherInfo`, and `ProcessEvent` are called by the combat engine. Add `defaultData` to initialize data at the beginning of each fight.
5. Add `name` and `description` translations for both `fr` and `en` under the modifier ID in `source/modifierLocalizations.js`.
6. Run `npm test`. Modifier loading validates unique IDs, tags, and translations.

### Ideas for making modifier authoring easier

- Define shared event and command schemas so modifier contracts and return shapes are easier to discover and validate.
- Add focused tests for each modifier's commands and event effects, using seeded randomness where needed.
- Add separate action, passive, and movement templates; those modifier types have different hooks and behavior requirements.

### Generating a modifier

Run `npm run create-modifier -- <id> <type>` with a lowercase camelCase ID and a type of `action`, `passive`, or `move`. The generator creates a modifier module, placeholder French and English translations, and a starter test in `tests/`. Action and move modifiers receive a `GetCommand` stub that throws until its behavior is implemented.

# TODOs:
-[x] have access to current fight data
-[x] have daily combat with a pause in the week-end
-[x] have combat statistics (win / death / kills etc)
-[x] Survey giving new modifiers
-[x] Tags
-[x] Seed (optional `/test-combat seed:` for reproducible test fights)
-[x] Localized mod description
-[x] solve inconsitency betwenn id modifierId and type for mod and events !!
-[x] Mod esquive
-[x] Mod tir à l'arc
-[x] Mod spin attack
-[x] Mod lance
-[x] Mod dash
-[x] Have test-combat with faster turns (timer as an option? / function to go to next action ?? / no wait ???)
-[x] Separate game logic from visualization (engine vs renderer)
-[] have a nice restart that knows how to handle old running data and how to resume the fights

## Later
-[] Mod en feu
-[] Mod fire breathing (+1 dégât et feu à l'attaque)
-[] Mod boule de feu
-[] Mod unit tests

## Ideas
- map
 - more things on maps
 - premade map
 - generated maps ?
- Suggesteur de Mod
- Level up des mods
