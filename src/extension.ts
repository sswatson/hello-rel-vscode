import * as vscode from "vscode";
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("hello-rel.newGlossary", async () => {
      const fileName = await vscode.window.showInputBox({
        prompt: "Type your component name, then press enter",
      });
      if (!fileName) {
        return;
      }
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || !folders.length) {
        vscode.window.showInformationMessage("no folder open");
        return;
      }
      const rootDir = folders[0].uri;

      const indexFileUri = vscode.Uri.joinPath(
        rootDir,
        "lib/glossary/index.ts"
      );
      const editor = await vscode.window.showTextDocument(indexFileUri);
      const { lineCount } = editor.document;
      const endOfFile = new vscode.Position(
        lineCount - 1,
        editor.document.lineAt(lineCount - 1).range.end.character
      );
      await editor.edit((edit) =>
        edit.insert(
          endOfFile,
          `\nexport { default as ${fileName}} from '@lib/glossary/${fileName}.mdx';`
        )
      );
      vscode.commands.executeCommand("workbench.action.files.save");

      const newComponentUri = vscode.Uri.joinPath(
        rootDir,
        "lib/glossary/" + fileName + ".mdx"
      );
      await vscode.workspace.fs.writeFile(newComponentUri, new Uint8Array());

      await vscode.window.showTextDocument(newComponentUri);
      vscode.window.showInformationMessage("glossary entry added");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("hello-rel.fixImports", async () => {
      // Get the active text editor and its content
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active text editor");
        return;
      }

      const document = editor.document;
      const filePath = document.fileName;
      const fileName = filePath.split("/").pop()?.replace(".mdx", "");
      const text = document.getText();

      // Step 1: Find lines with the desired format
      const regex = /```rel .*?output={(.*?)}/g;
      const matches = [...text.matchAll(regex)];

      // Step 2: Generate import statements for each matched line
      const importStatements = unique(
          matches
            .map((match) => match[1])
        )
        .map((file) => {
          return `import ${file} from "@assets/output/${fileName}/${file}.json";\n`;
        })
        .join("");

      // Step 3: Find the block of existing import statements
      const importBlockRegex =
        /import .*? from "@assets\/output\/.*?\.json";\n/g;
      let start = 0;
      let end = 0;
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (importBlockRegex.test(line)) {
          if (start === null) {
            start = i;
          }
        } else if (start !== null) {
					end = i;
					break;
				}
      }


			// replace the lines from start to end:
			const edit = new vscode.WorkspaceEdit();
			const importRange = new vscode.Range(
				new vscode.Position(start, 0),
				new vscode.Position(end + 1, 0)
			);

			edit.replace(document.uri, importRange, importStatements);
			await vscode.workspace.applyEdit(edit);
    })
  );
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function deactivate() {}
