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

# TODOs:
-[x] have access to current fight data
-[x] have daily combat with a pause in the week-end
-[x] have combat statistics (win / death / kills etc)
-[] Implement new modifiers
-[] Survey giving new modifiers
-[] Tags

## Later

## Ideas
- map
 - more things on maps
 - premade map
 - generated maps ?
