import * as vscode from "vscode";
import fetch from "node-fetch";
import CustomCompletionItemProvider, {
  CommandItemProps,
} from "../customCompletionItem";

type ChoicesType = Array<{
  message: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    function_call: {
      arguments: string;
    };
  };
}>;
type AiResurt = {
  choices: ChoicesType;
};

let config = vscode.workspace.getConfiguration("getfieldname");
let value = config.get("openaikey");

export default class VartranslatedEn {
  constructor(private selectedText: string) {}
  public async run() {
    try {
      if (!this?.selectedText) {
        vscode.window.showWarningMessage("未选中文本");
        return [];
      }
      const response = await fetch(
        "https://run.dingjunjie.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
            authorization:
              "Bearer " + value,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo-16k-0613",
            messages: [
              {
                role: "user",
                content: `
                我在自学编程，但是我的母语不是英语，我需要将${this.selectedText} 字段改写成英文变量，你可以教我改吗？
                  `,
              },
            ],
            // eslint-disable-next-line @typescript-eslint/naming-convention
            function_call: {
              name: "get_var",
            },
            functions: [
              {
                name: "get_var",
                description: `            
                    根据当前中文变量，改写成英文变量，变量符合编程习惯
                          `,
                parameters: {
                  type: "object",
                  properties: {
                    varName1: {
                      type: "string",
                      description: "这里指改写后的英文变量，符合驼峰命名",
                    },
                    varName2: {
                      type: "string",
                      description: "这里同样是指改写后的英文变量，也符合驼峰命名，但它是备用变量",
                    },
                  },
                  required: ["varName1", "varName2"],
                },
              },
            ],
            stream: false,
          }),
        }
      );
      if (response.status !== 200) {
        const { error } = (await response.json()) as any;
        console.log(error, "error");
        vscode.window.showErrorMessage(error.message, response.statusText);
        return [];
      }
      const res = (await response.json()) as AiResurt;
      const responseMessage = res.choices[0].message;
      if (!responseMessage.function_call) {
        vscode.window.showErrorMessage("ai接口返回错误");
        return [];
      }
      const variablesStr = responseMessage.function_call.arguments;
      console.log("variablesStr===>", variablesStr);
      const variables: string[] = Object.values(JSON.parse(variablesStr));

      const getVartranslatedEnItem = (): CommandItemProps[] => {
        const vartranslatedEnItem = variables.map((item) => ({
          label: item,
          kind: vscode.CompletionItemKind.Event,
          detail: item,
          isHideInsertText: false,
        }));

        return vartranslatedEnItem;
      };
      const customCompletionItemProvider = new CustomCompletionItemProvider(
        getVartranslatedEnItem
      );
      const disposable = vscode.languages.registerCompletionItemProvider(
        { scheme: "file" },
        customCompletionItemProvider
      );
      return [disposable];
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}
