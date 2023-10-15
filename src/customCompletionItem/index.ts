import * as vscode from "vscode";
export interface CommandItemProps {
  label: string;
  kind: vscode.CompletionItemKind | undefined;
  command?: (document: vscode.TextDocument, position: vscode.Position) => void;
  isHideInsertText: boolean;
}
export default class CustomCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  constructor(
    private items: (
      document: vscode.TextDocument,
      position: vscode.Position
    ) => Promise<Array<CommandItemProps>> | Array<CommandItemProps> = () => [],
    private disabledFun: (lineText: string) => boolean = () => false
  ) {

    console.log('CustomCompletionItemProvider load');
  }
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem[] | null> {

    const line = document.lineAt(position.line);
    const lineText = line.text;
    if(this.disabledFun(lineText)) {
      return [];
    }
    const editor = vscode.window.activeTextEditor;
    // 创建自动完成项
    const completionItems: vscode.CompletionItem[] = (
      await this.items(document, position)
    ).map((item) => {
      const completionItem = new vscode.CompletionItem(item.label, item.kind);
      completionItem.command = {
        command: "extension.itemSelected",
        title: item.label + " Selected",
        arguments: [
          async () => {
            if (editor) {
              const startPosition = new vscode.Position(
                position.line,
                line.range.end.character - 3
              ); // 设置起始位置
              const endPosition = new vscode.Position(
                position.line,
                line.range.end.character
              ); // 设置结束位置
              const selection = new vscode.Selection(
                startPosition,
                endPosition
              );
              editor.edit((editBuilder) => {
                editBuilder.delete(selection);
              });
            }
            item.command && item.command(document, position);
          },
        ],
      };
      completionItem.insertText = !item.isHideInsertText ? item.label : "";
      return completionItem;
    });

    return completionItems;
  }
}
