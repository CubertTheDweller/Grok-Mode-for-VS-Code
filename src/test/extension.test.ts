import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Starting Grok Mode tests.');

    test('Commands are registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('grokMode.start'), 'grokMode.start should be registered');
        assert.ok(commands.includes('grokMode.stop'), 'grokMode.stop should be registered');
        assert.ok(
            commands.includes('grokMode.togglePlanningMode'),
            'grokMode.togglePlanningMode should be registered',
        );
    });
});
