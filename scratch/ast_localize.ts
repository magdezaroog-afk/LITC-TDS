import { Project, Node, SyntaxKind, JsxText, StringLiteral } from "ts-morph";
import * as fs from 'fs';
import * as path from 'path';

const project = new Project({
    tsConfigFilePath: "./tsconfig.json",
});

const arPath = path.resolve('./src/locales/ar.json');
const enPath = path.resolve('./src/locales/en.json');
const contextPath = path.resolve('./src/engine/ui-loader/LanguageContext');

const arDict = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));

let autoCounter = 1;
function getNextKey() {
    while (arDict[`ui.auto_${autoCounter}`] !== undefined) {
        autoCounter++;
    }
    return `ui.auto_${autoCounter}`;
}

const arabicRegex = /[\u0600-\u06FF]/;

const files = project.getSourceFiles();
console.log(`Processing ${files.length} files...`);

let modifications = 0;

for (const sourceFile of files) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('node_modules')) continue;
    if (!filePath.includes('src/pages') && !filePath.includes('src/components')) continue;

    let fileModified = false;
    let needsHook = false;

    try {
        // Iterate through all nodes to find StringLiterals and JsxText
        sourceFile.forEachDescendant(node => {
            // Handle JsxText (e.g. <div>عربي</div>)
            if (Node.isJsxText(node)) {
                const text = node.getLiteralText();
                if (arabicRegex.test(text) && !text.includes('t(')) {
                    const trimmedText = text.trim();
                    if (trimmedText.length === 0) return;

                    let key = Object.keys(arDict).find(k => arDict[k] === trimmedText);
                    if (!key) {
                        key = getNextKey();
                        arDict[key] = trimmedText;
                        enDict[key] = trimmedText;
                    }
                    
                    // Replace the JSX Text node with an expression
                    // We need to preserve surrounding whitespace if any
                    const before = text.substring(0, text.indexOf(trimmedText));
                    const after = text.substring(text.indexOf(trimmedText) + trimmedText.length);
                    
                    node.replaceWithText(`${before}{t('${key}') || '${trimmedText}'}${after}`);
                    fileModified = true;
                    needsHook = true;
                }
            }
            
            // Handle StringLiterals (e.g. placeholder="عربي" or const x = "عربي")
            else if (Node.isStringLiteral(node)) {
                const text = node.getLiteralValue();
                if (arabicRegex.test(text) && !text.includes('t(')) {
                    const trimmedText = text.trim();
                    if (trimmedText.length === 0) return;

                    let key = Object.keys(arDict).find(k => arDict[k] === trimmedText);
                    if (!key) {
                        key = getNextKey();
                        arDict[key] = trimmedText;
                        enDict[key] = trimmedText;
                    }
                    
                    const parent = node.getParent();
                    if (Node.isJsxAttribute(parent)) {
                        node.replaceWithText(`{t('${key}') || '${text}'}`);
                        fileModified = true;
                        needsHook = true;
                    } else if (
                        Node.isPropertyAssignment(parent) || 
                        Node.isVariableDeclaration(parent) || 
                        Node.isReturnStatement(parent) || 
                        Node.isBinaryExpression(parent) || 
                        Node.isConditionalExpression(parent) || 
                        Node.isCallExpression(parent) || 
                        Node.isArrayLiteralExpression(parent)
                    ) {
                        // For safety, only wrap strings in code, not strings used as keys or enum values.
                        // If it's a property assignment, make sure it's not the key name.
                        if (Node.isPropertyAssignment(parent)) {
                            if (parent.getNameNode() === node) return; // Don't replace keys
                        }
                        node.replaceWithText(`(t('${key}') || '${text}')`);
                        fileModified = true;
                        needsHook = true;
                    }
                }
            }
        });

        if (needsHook) {
            // Find if we already have the import
            const imports = sourceFile.getImportDeclarations();
            let hasUseLanguage = false;
            for (const imp of imports) {
                for (const named of imp.getNamedImports()) {
                    if (named.getName() === 'useLanguage') {
                        hasUseLanguage = true;
                        break;
                    }
                }
            }

            if (!hasUseLanguage) {
                // Calculate relative path
                const relPath = path.relative(path.dirname(filePath), contextPath).replace(/\\/g, '/');
                sourceFile.addImportDeclaration({
                    namedImports: ["useLanguage"],
                    moduleSpecifier: relPath.startsWith('.') ? relPath : `./${relPath}`
                });
            }

            // Try to inject const { t } = useLanguage(); into the main component function
            // This is a naive injection finding the first FunctionDeclaration or ArrowFunction that returns JSX
            let hookInjected = false;
            
            // Find if `t` is already declared
            let tDeclared = false;
            sourceFile.forEachDescendant(node => {
                if (Node.isVariableDeclaration(node)) {
                    if (node.getName() === 't' || node.getText().includes('{ t }')) {
                        tDeclared = true;
                    }
                }
            });

            if (!tDeclared) {
                const functions = sourceFile.getFunctions();
                for (const func of functions) {
                    if (func.getBodyText()?.includes('<') || func.getName()?.match(/^[A-Z]/)) {
                        func.insertStatements(0, "const { t } = useLanguage();");
                        hookInjected = true;
                        break;
                    }
                }
                if (!hookInjected) {
                    // Check arrow functions assigned to variables (e.g. const Component = () => { ... })
                    const varDecls = sourceFile.getVariableDeclarations();
                    for (const decl of varDecls) {
                        const init = decl.getInitializer();
                        if (Node.isArrowFunction(init)) {
                            const body = init.getBody();
                            if (Node.isBlock(body)) {
                                if (body.getText().includes('<') || decl.getName()?.match(/^[A-Z]/)) {
                                    body.insertStatements(0, "const { t } = useLanguage();");
                                    hookInjected = true;
                                    break;
                                }
                            } else if (Node.isJsxElement(body) || Node.isJsxFragment(body) || Node.isParenthesizedExpression(body)) {
                                // If it's an implicit return arrow function, we must convert it to a block
                                // e.g. const A = () => <div>...</div> -> const A = () => { const { t } = useLanguage(); return <div>...</div> }
                                try {
                                    const bodyText = body.getText();
                                    const paramsText = init.getParameters().map(p => p.getText()).join(', ');
                                    init.replaceWithText(`(${paramsText}) => {\n  const { t } = useLanguage();\n  return ${bodyText};\n}`);
                                    hookInjected = true;
                                    break;
                                } catch (err) {
                                    console.warn("Failed to inject hook into arrow function");
                                }
                            }
                        }
                    }
                }
            }
        }

        if (fileModified) {
            modifications++;
            console.log(`Successfully translated: ${path.basename(filePath)}`);
        }
    } catch (e) {
        console.error(`Failed to process ${path.basename(filePath)}:`, e.message);
    }
}

fs.writeFileSync(arPath, JSON.stringify(arDict, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enDict, null, 2));

project.saveSync();
console.log(`Complete! Modified ${modifications} files safely using AST.`);
