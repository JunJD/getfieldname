/**
 * todo
 * [done] gpt的 function call
 * [done] ‘/’触发SlashCommand，SlashCommand实现一个item类
 * [] 实现一个变量转换功能的item
 * [] 实现一个
 */

import * as vscode from "vscode";
import Suggestion, { SuggestionItemType } from "./suggestion/ index";
import VartranslatedEn from "./vartranslatedEn/index";

// 当前活跃的action
let isActiveSuggestionItem: string | undefined = undefined;

// ************************** 变量转换 vars **************************
// 中文words
let chineseWords: [number, number][] = [];
// currentActiveIndex
let currentActiveIndex = 0;
function nextActiveChineseWord() {
  if (currentActiveIndex >= chineseWords.length - 1) {
    currentActiveIndex = 0;
  } else {
    currentActiveIndex = currentActiveIndex + 1;
  }
  return chineseWords[currentActiveIndex];
}

// ************************** vscode utils **************************
/**
 * 获取单词的位置
 * @param character 参数表示一个字符的位置，它是一个数字类型（number）的值。
 * @param line 参数表示当前单词属于那一行，它是一个数字类型（number）的值
 * @returns 单词的位置
 */
function getWordPosition(character: number, line: number): vscode.Position {
  return new vscode.Position(line, character);
}

/**
 * 根据单词起始和结束位置设置选区
 * @param wordStartEndTuple 表示一个包含中文单词起始和结束位置的数组，它是一个元组类型（[number, number]）的值。
 * @param position 表示当前位置，它是一个vscode.Position类型的值。
 */
function setSelection(
  wordStartEndTuple: [number, number],
  position: vscode.Position
) {
  const startPosition = getWordPosition(wordStartEndTuple[0], position.line); // 设置起始位置
  const endPosition = getWordPosition(wordStartEndTuple[1], position.line); // 设置结束位置
  const selection = new vscode.Selection(startPosition, endPosition);
  const editor = vscode.window.activeTextEditor;
  editor!.selection = selection;
}

// ************************** vscode activate **************************

export async function activate(context: vscode.ExtensionContext) {
  /**
   * 由‘/’触发的action集合item
   */
  const getSuggestionItems = async (): Promise<SuggestionItemType[]> => {
    return [
      {
        label: "变量转换",
        kind: vscode.CompletionItemKind.Event,
        isHideInsertText: true,
        command: (document: vscode.TextDocument, position: vscode.Position) => {
          const line = document.lineAt(position.line);
          const lineText = line.text;
          // 匹配中文单词的正则表达式
          const regex = /[\u4e00-\u9fa5]+/g;
          chineseWords = [];
          let match;
          while ((match = regex.exec(lineText)) !== null) {
            const startIndex = match.index;
            const endIndex = startIndex + match[0].length;
            const wordRange: [number, number] = [startIndex, endIndex];
            chineseWords.unshift(wordRange);
          }
          if (Array.isArray(chineseWords) && chineseWords.length > 0) {
            const firstchineseWord = chineseWords[0];
            setSelection(firstchineseWord, position);
            isActiveSuggestionItem = "变量转换";
          }
        },
      },
    ];
  };
  const suggestion = new Suggestion(getSuggestionItems);
  const disposables = suggestion.run();

  /**
   * 聚焦编辑器且有选中selection触发的tab键事件处理
   */
  let disposableTabListener = vscode.commands.registerTextEditorCommand(
    "extension.tabHasSelectionCommand",
    (textEditor) => {
      switch (isActiveSuggestionItem) {
        case "变量转换":
          const position = textEditor.selection.active;
          setSelection(nextActiveChineseWord(), position);
          break;

        default:
          vscode.commands.executeCommand("type", { text: "\t" });
          break;
      }
    }
  );

  /**
   * 聚焦编辑器且有选中selection触发的enter键事件处理
   */
  let disposableEnterListener = vscode.commands.registerTextEditorCommand(
    "extension.enterHasSelectionCommand",
    async (textEditor) => {
      const selection = textEditor.selection;
      const selectedText = textEditor.document.getText(selection);
      vscode.window.showInformationMessage(selectedText+ ' ' +'loading...');
      switch (isActiveSuggestionItem) {
        case "变量转换":
          isActiveSuggestionItem = undefined;
          const vartranslatedEn = new VartranslatedEn(selectedText);
          const vartranslatedEnDisposables = await vartranslatedEn.run();
          context.subscriptions.push(...vartranslatedEnDisposables);
          textEditor!.edit((editBuilder) => {
            editBuilder.delete(selection);
          });
          vscode.commands.executeCommand("editor.action.triggerSuggest");
          break;

        default:
          vscode.commands.executeCommand("editor.action.insertLineAfter");
          break;
      }
    }
  );

  context.subscriptions.push(
    ...disposables,
    disposableTabListener,
    disposableEnterListener
  );
}
