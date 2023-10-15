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

export default class VartranslatedEn {
  constructor(private selectedText: string) {}
  public async run() {
    try {
      if (!this?.selectedText) {
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
              // "Bearer " + "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",
              "Bearer " + "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",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo-16k-0613",
            temperature: 0,
            messages: [
              {
                role: "user",
                content: `
                [functions_calling]
                According to the Chinese name provided by the user, generate multiple English variables to meet the user's naming needs during the programming process. The requirements for naming variables are as follows/\n
                ${this.selectedText}
                      `,
              },
            ],
            functions: [
              {
                name: "get_var",
                description: `            
                    According to the Chinese name provided by the user, generate multiple English variables to meet the user's naming needs during the programming process. The requirements for naming variables are as follows
                          `,
                parameters: {
                  type: "object",
                  properties: {
                    varName1: {
                      type: "string",
                      description:
                        "Generate an English variable based on the Chinese name provided by the user, which is relatively specific and comprehensive.Use Camel case naming convention",
                    },
                    varName2: {
                      type: "string",
                      description:
                        "Generate an English variable based on the Chinese name provided by the user, which is relatively abstract and comprehensive.Use Camel case naming convention",
                    },
                    varName3: {
                      type: "string",
                      description:
                        "Generate an English variable based on the Chinese name provided by the user, which is relatively abstract and comprehensive.Use Camel case naming convention",
                    },
                    varName4: {
                      type: "string",
                      description:
                        "Generate an English variable based on the Chinese name provided by the user, which is relatively abstract but not comprehensive.Use Camel case naming convention",
                    },
                  },
                  required: ["varName1", "varName2", "varName3", "varName4"],
                },
              },
            ],
            stream: false,
          }),
        }
      );
      if (response.status !== 200) {
        vscode.window.showErrorMessage("ai接口状态码：", response.statusText);
        return [];
      }
      const variablesStr0 = (await response.json()) as AiResurt;
      const variablesStr1 = variablesStr0.choices[0].message.function_call;
      if (!variablesStr1) {
        return [];
      }
      const variablesStr = variablesStr1.arguments;

      const variables: string[] = Object.values(JSON.parse(variablesStr));

      const getVartranslatedEnItem = (): CommandItemProps[] => {
        const vartranslatedEnItem = variables.map((item) => ({
          label: item,
          kind: vscode.CompletionItemKind.Event,
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
