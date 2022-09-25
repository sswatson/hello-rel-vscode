import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {
	
	console.log('Congratulations, your extension "hello-rel" is now active!');

	let disposable = vscode.commands.registerCommand('hello-rel.newGlossary', async () => {
		const fileName = await vscode.window.showInputBox({
			prompt: 'Type your component name, then press enter',
		});
		if (!fileName) { return; }
		const folders = vscode.workspace.workspaceFolders;
		if (!folders || !folders.length) {
			vscode.window.showInformationMessage('no folder open');
			return;
		}
		const rootDir = folders[0].uri;

		const indexFileUri = vscode.Uri.joinPath(rootDir, "lib/glossary/index.ts");
		const editor = await vscode.window.showTextDocument(indexFileUri);
		const { lineCount } = editor.document;
		const endOfFile = new vscode.Position(
			lineCount,
			editor.document.lineAt(lineCount).range.end.character,
		);
		await editor.edit(edit => edit.insert(
			endOfFile,
			`\nexport { default as ${fileName}} from '@lib/glossary/${fileName}.mdx';`
		));
		vscode.commands.executeCommand("workbench.action.files.save");

		const newComponentUri = vscode.Uri.joinPath(rootDir, 'lib/glossary/' + fileName + '.mdx');
		await vscode.workspace.fs.writeFile(newComponentUri, new Uint8Array());
		
		await vscode.window.showTextDocument(newComponentUri);
		vscode.window.showInformationMessage('glossary entry added');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
