const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createModifier } = require('../scripts/create-modifier.js');

test('modifier generator creates the module, translations, and starter test', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kingdominion-modifier-'));
    const sourceRoot = path.join(root, 'source');
    fs.mkdirSync(path.join(sourceRoot, 'templates'), { recursive: true });
    fs.mkdirSync(path.join(sourceRoot, 'modifier', 'action'), { recursive: true });
    fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
    fs.copyFileSync(
        path.join(__dirname, '..', 'source', 'templates', 'modifier.js.template'),
        path.join(sourceRoot, 'templates', 'modifier.js.template'),
    );
    fs.copyFileSync(
        path.join(__dirname, '..', 'source', 'modifierLocalizations.js'),
        path.join(sourceRoot, 'modifierLocalizations.js'),
    );

    try {
        const files = createModifier({ id: 'testAction', type: 'action', root });
        const moduleContent = fs.readFileSync(files.modifierPath, 'utf8');
        const localizationContent = fs.readFileSync(files.localizationPath, 'utf8');
        const testContent = fs.readFileSync(files.testPath, 'utf8');

        assert.match(moduleContent, /id: 'testAction'/);
        assert.match(moduleContent, /type: 'action'/);
        assert.match(moduleContent, /GetCommand\(/);
        assert.match(localizationContent, /testAction:/);
        assert.match(testContent, /testAction/);
        execFileSync(process.execPath, ['--test', files.testPath], { cwd: root, stdio: 'pipe' });
        assert.throws(
            () => createModifier({ id: 'testAction', type: 'action', root }),
            /File already exists/,
        );
    }
    finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('modifier generator rejects invalid IDs and types', () => {
    assert.throws(
        () => createModifier({ id: 'bad-id', type: 'action' }),
        /Modifier ID must start/,
    );
    assert.throws(
        () => createModifier({ id: 'validId', type: 'unknown' }),
        /Modifier type must be one of/,
    );
});
