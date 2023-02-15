import { statements } from "../data.js";
import { lexProgram } from "./lexer.js";
export function assembleProgram(program) {
    const lexedProgram = lexProgram(program);
    const processedProgram = processProgram(lexedProgram);
    const memoryValues = processedProgram.lines.map(line => line.statementDefinition.getOutput(line));
    const memoryLoadInstructions = memoryValues.reduce((acc, val) => {
        if (val.address != undefined)
            acc.push([val.address, [val.value]]);
        else
            acc.at(-1)[1].push(val.value);
        return acc;
    }, [[0, []]]);
    return memoryLoadInstructions;
}
export function processProgram(lexedProgram) {
    const lines = [];
    for (const line of lexedProgram.lines) {
        const def = getStatementDefinition(line);
        if (def == null)
            throw new Error(`Invalid line "${line.rawText}"`);
        lines.push(def[1]);
    }
    return { lines };
}
export function lineMatches(line, statement) {
    if (line.lexemes.length > statement.maxLexemes)
        return false; //Too many lexemes
    if (line.lexemes.length < statement.minLexemes)
        return false; //Not enough lexemes
    const lineCopy = line.lexemes.slice();
    const assignedLine = [];
    for (const [i, matcher] of statement.lexemeMatchers.entries()) {
        const lexeme = lineCopy[0];
        if (lexeme && matcher.matcher(lexeme)) {
            lineCopy.shift();
            assignedLine.push(lexeme);
        }
        else if (matcher.isOptional) {
            assignedLine.push(null);
        }
        else if (!lexeme) {
            return false;
            //Not enough lexemes
        }
        else {
            return false;
            //`Required matcher ${matcher.matcher.toString()} did not match lexeme ${lexeme}`
        }
    }
    if (lineCopy.length > 0)
        return false; //Too many lexemes
    return {
        statementDefinition: statement, lexemes: assignedLine, rawText: line.rawText
    };
}
export function getStatementDefinitions(line) {
    return Object.values(statements).map(def => [def, lineMatches(line, def)]).filter(([def, result]) => result);
}
export function getStatementDefinition(line) {
    var _a;
    return (_a = getStatementDefinitions(line)[0]) !== null && _a !== void 0 ? _a : null;
}
