import * as vscode from 'vscode';
import fetch from 'node-fetch';

interface ContextType {
    language: 'typescript' | 'javascript',
    allText: string,
    relativePath?: string
}

export default async function transformVariable(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context?: ContextType
): Promise<vscode.ProviderResult<vscode.Hover> | undefined> {
    if (!context) {
        context = {
            language: 'javascript',
            allText: ''
        };
    }
    const { language, allText, relativePath } = context;
    const shengmings = ['const', 'var', 'class', 'let', 'function'];
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
        return;
    }
    const wordStart = wordRange!.start;
    const previousWordRange = document.getWordRangeAtPosition(wordStart.translate(0, -1));
    const previousWord = document.getText(previousWordRange);
    if (!shengmings.find(item => item === previousWord)) {
        return;
    }
    let config = vscode.workspace.getConfiguration('getfieldname');
    let value = config.get('openaikey');

    const hoveredWord = document.getText(wordRange);
    const response = await fetch('https://run.dingjunjie.com/v1/chat/completions', {
        method: "POST",
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': "application/json",
            'authorization': "Bearer " + value,
        },
        body: JSON.stringify(
            {
                model: "gpt-3.5-turbo-16k-0613",
                temperature: 0,
                messages: [
                    {
                        role: "system",
                        content: `
                        用户是一名程序员，他(她)需要帮我处理一些事情，请严格按照她的要求执行，以下是代码的一些相关信息，你可以作为参考：
                        代码全文是：[${allText}],使用的语言是：${language}${relativePath?(',代码在项目所处路径是'+relativePath):''}。
                        `,
                    },
                    {
                        role: "user",
                        content: `我不太理解这个变量在这个代码中的意思：${hoveredWord}；它的意思是：`,
                    },
                ],
                stream: false,
            }
        ),
    });

    vscode.window.showInformationMessage((await response.json() as any).choices[0].message?.content);
    return await new Promise(resolve => {
        setTimeout(() => {
            const wordRange = document.getWordRangeAtPosition(position);
            const hoveredWord = document.getText(wordRange);
            resolve(new vscode.Hover(hoveredWord + '-' + previousWord));
        }, 0);
    });
}


