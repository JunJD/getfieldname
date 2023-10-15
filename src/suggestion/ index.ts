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
        await command();
      }
    );
    return [disposable, commandDisposable];
  }
}
