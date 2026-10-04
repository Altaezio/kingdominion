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

- Run the command `node deploy-commands.js` to register all the slash commands of your bot
  - Do this the very first time and anytime you add a new command to your bot, not everytime you start it
- Run the command `node .` 

Your bot should be online and ready to receive commands and take actions

If you made a change or added a new command, you can use the command `/reload [nameOdTheCommandToReload]`.  
Careful, this command is currently setup as public and anyone can use it.  
You might want it to be deployed as a guild command in a private guild.

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

## Later
-[] Separate game logic from visualization (engine vs renderer)
-[] Have test-combat with faster turns (timer as an option? / function to go to next action ?? / no wait ???)
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
