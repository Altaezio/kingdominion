const fs = require('node:fs');
const path = require('node:path');

const modifierTypes = ['action', 'passive', 'move'];
const localizationAnchor = '\n};\n\nfunction getLanguage(locale)';

function createModifier({ id, type, root = path.resolve(__dirname, '..') }) {
    if (typeof id !== 'string' || !/^[a-z][a-zA-Z0-9]*$/.test(id))
        throw new Error('Modifier ID must start with a lowercase letter and contain only letters and digits');
    if (!modifierTypes.includes(type))
        throw new Error(`Modifier type must be one of: ${modifierTypes.join(', ')}`);

    const templatePath = path.join(root, 'source', 'templates', 'modifier.js.template');
    const localizationPath = path.join(root, 'source', 'modifierLocalizations.js');
    const modifierPath = path.join(root, 'source', 'modifier', type, `${id}.js`);
    const testPath = path.join(root, 'tests', `${id}.test.js`);

    for (const filePath of [modifierPath, testPath]) {
        if (fs.existsSync(filePath))
            throw new Error(`File already exists: ${path.relative(root, filePath)}`);
    }

    let modifierTemplate = fs.readFileSync(templatePath, 'utf8')
        .replace(/\r\n/g, '\n')
        .replaceAll('replaceWithUniqueModifierId', id)
        .replaceAll('replaceWithTypeModifier', type);
    const localizationSource = fs.readFileSync(localizationPath, 'utf8').replace(/\r\n/g, '\n');
    if (new RegExp(`^\\s*${id}:\\s*\\{`, 'm').test(localizationSource))
        throw new Error(`Localization already exists for modifier: ${id}`);
    if (!localizationSource.includes(localizationAnchor))
        throw new Error('Could not find the modifier localization insertion point');

    const commandMethod = type === 'passive'
        ? ''
        : `
    GetCommand(barrack, fighterId, arenaManager, info, instruction) {
        throw new Error('${id}.GetCommand must be implemented before this modifier is used');
    },
`;
    modifierTemplate = modifierTemplate.replace(
        '\n    // Action and move modifiers must implement GetCommand with their behavior.\n',
        `${commandMethod}\n`,
    );

    const localizationEntry = `\n    ${id}: {
        name: { fr: 'Nom à définir', en: 'Name to define' },
        description: { fr: 'Description à définir', en: 'Description to define' },
    },`;
    const testSource = `const assert = require('node:assert/strict');
const test = require('node:test');
const modifier = require('../source/modifier/${type}/${id}.js');

test('${id} has the expected modifier structure', () => {
    assert.equal(modifier.id, '${id}');
    assert.equal(modifier.type, '${type}');
    assert.equal(typeof modifier.GatherWantedInfo, 'function');
    assert.equal(typeof modifier.GatherInfo, 'function');
    assert.equal(typeof modifier.ProcessEvent, 'function');
${type === 'passive' ? '' : "    assert.equal(typeof modifier.GetCommand, 'function');\n"}});
`;

    const localizationIndex = localizationSource.indexOf(localizationAnchor);
    const updatedLocalizations = localizationSource.slice(0, localizationIndex) +
        localizationEntry +
        localizationSource.slice(localizationIndex);
    fs.mkdirSync(path.dirname(modifierPath), { recursive: true });
    fs.mkdirSync(path.dirname(testPath), { recursive: true });
    fs.writeFileSync(modifierPath, modifierTemplate);
    fs.writeFileSync(localizationPath, updatedLocalizations);
    fs.writeFileSync(testPath, testSource);

    return { modifierPath, localizationPath, testPath };
}

if (require.main === module) {
    try {
        const [, , id, type] = process.argv;
        const created = createModifier({ id, type });
        console.log(`Created modifier: ${path.relative(process.cwd(), created.modifierPath)}`);
        console.log(`Added translations: ${path.relative(process.cwd(), created.localizationPath)}`);
        console.log(`Created starter test: ${path.relative(process.cwd(), created.testPath)}`);
    }
    catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = { createModifier };
