import * as vscode from "vscode";
import CustomCompletionItemProvider, {
  CommandItemProps,
} from "../customCompletionItem";

export type SuggestionItemType = CommandItemProps;

export default class Suggestion {
  constructor(
    private suggestionItems: (
      document: vscode.TextDocument,
      position: vscode.Position
    ) => Promise<Array<CommandItemProps>> | Array<CommandItemProps> = () => []
  ) {}
  public run() {
    const customCompletionItemProvider = new CustomCompletionItemProvider(
      this.suggestionItems,
      (lineText) => {
        return !lineText.endsWith("///");
      }
    );
    const disposable = vscode.languages.registerCompletionItemProvider(
      { scheme: "file" },
      customCompletionItemProvider,
      "/"
    );
    // 注册命令处理程序
    const commandDisposable = vscode.commands.registerCommand(
      "extension.itemSelected",
      async (command: () => void) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const position = editor.selection.active;
          const document = editor.document;
          const line = document.lineAt(position.line);
          const startPosition = new vscode.Position(
            position.line,
            line.range.end.character - 3
          ); // 设置起始位置
          const endPosition = new vscode.Position(
            position.line,
            line.range.end.character
          ); // 设置结束位置
          const selection = new vscode.Selection(startPosition, endPosition);
          editor.edit((editBuilder) => {
            editBuilder.delete(selection);
          });
        }
        await command();
      }
    );
    return [disposable, commandDisposable];
  }
}
