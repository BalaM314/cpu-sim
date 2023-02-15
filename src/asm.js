import { instructionMapping } from "./cpu.js";
const lexemeTypes = ["number", "instruction", "label"];
export function processLexemeMatcherString(str) {
    let slicedStr, isOptional;
    if (str.endsWith("?")) {
        slicedStr = str.slice(0, -1);
        isOptional = true;
    }
    else {
        slicedStr = str;
        isOptional = false;
    }
    if (slicedStr.includes("|")) {
        const types = slicedStr.split("|");
        types.forEach(type => {
            if (!lexemeTypes.includes(type))
                throw new Error(`Invalid lexeme matcher string, this is an error with cpu-sim`);
        });
        return {
            matcher: lexeme => types.includes(lexeme.type),
            isOptional
        };
    }
    else {
        return {
            matcher: lexeme => slicedStr == lexeme.type,
            isOptional
        };
    }
}
export const statements = (statements => Object.fromEntries(Object.entries(statements)
    .map(([k, v]) => [k, Object.assign(Object.assign({}, v), { lexemeMatchers: v.lexemes.map(processLexemeMatcherString) })]).map(([k, v]) => [k, Object.assign(Object.assign({}, v), { maxLexemes: v.lexemeMatchers.length, minLexemes: v.lexemeMatchers.filter(m => !m.isOptional).length })])))({
    instruction: {
        lexemes: ["number|label?", "instruction", "number?"],
        getOutput(line) {
            var _a, _b, _c;
            const instruction = line.lexemes[1].value;
            const id = instructionMapping.get(instruction);
            if (id == undefined)
                throw new Error(`Invalid instruction ${instruction}`);
            return {
                address: ((_a = line.lexemes[0]) === null || _a === void 0 ? void 0 : _a.type) == "number" ? +line.lexemes[0].value : undefined,
                value: (+id << 8) + +((_c = (_b = line.lexemes[2]) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 0)
            };
        }
    },
    memoryValue: {
        lexemes: ["number|label?", "number"],
        getOutput(line) {
            var _a;
            return {
                address: ((_a = line.lexemes[0]) === null || _a === void 0 ? void 0 : _a.type) == "number" ? +line.lexemes[0].value : undefined,
                value: +(line.lexemes[1].value)
            };
        }
    }
});
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
            throw new Error(`Invalid line ${line.map(l => l.value).join(" ")}`); //TODO include text in lexedline
        lines.push(def[1]);
    }
    return { lines };
}
export function lineMatches(line, statement) {
    if (line.length > statement.maxLexemes)
        return false; //Too many lexemes
    if (line.length < statement.minLexemes)
        return false; //Not enough lexemes
    const lineCopy = line.slice();
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
        statementDefinition: statement, lexemes: assignedLine
    };
}
export function getStatementDefinitions(line) {
    return Object.values(statements).map(def => [def, lineMatches(line, def)]).filter(([def, result]) => result);
}
export function getStatementDefinition(line) {
    var _a;
    return (_a = getStatementDefinitions(line)[0]) !== null && _a !== void 0 ? _a : null;
}
export function splitLineOnSpace(line) {
    if (line.includes(`"`)) {
        const chunks = [""];
        let isInString = false;
        for (const char of line) {
            if (char == `"`) {
                isInString = !isInString;
            }
            if (!isInString && char == " ") {
                chunks.push("");
            }
            else {
                chunks[chunks.length - 1] += char;
            }
        }
        if (isInString)
            throw new Error("unterminated string literal");
        return chunks;
    }
    else {
        return line.split(" ");
    }
}
export function lexLine(line) {
    return splitLineOnSpace(line).map(chunk => {
        if (chunk.match(/^[a-z]{3}$/i))
            return { type: "instruction", value: chunk };
        if (chunk.match(/^\d+$/i))
            return { type: "number", value: chunk };
        if (chunk.match(/^\w+\:$/i))
            return { type: "label", value: chunk };
        throw new Error(`Invalid chunk ${chunk} in line ${line}`);
    });
}
/**Removes trailing/leading whitespaces and tabs from a line. */
export function removeTrailingSpaces(line) {
    return line
        .replace(/(^[ \t]+)|([ \t]+$)/g, "");
}
/**Removes single line and multiline comments from a line. */
export function removeComments(line) {
    const charsplitInput = line.split("");
    const parsedChars = [];
    let lastChar = "";
    const state = {
        inSComment: false,
        inMComment: false,
        inDString: false
    };
    for (const _char in charsplitInput) {
        const char = charsplitInput[_char];
        if (typeof char !== "string")
            continue;
        if (state.inSComment) {
            if (char === "\n") {
                state.inSComment = false;
            }
            lastChar = char;
            continue;
        }
        else if (state.inMComment) {
            if (lastChar === "*" && char === "/") {
                state.inMComment = false;
            }
            lastChar = char;
            continue;
        }
        else if (state.inDString) {
            if (lastChar !== `\\` && char === `"`) {
                state.inDString = false;
            }
        }
        else if (char === "#") {
            state.inSComment = true;
            lastChar = char;
            continue;
            //skip characters until next newline
        }
        else if (lastChar === "/" && char === "*") {
            state.inMComment = true;
            parsedChars.pop();
            lastChar = char;
            continue;
            //skip characters until "*/"
        }
        else if (lastChar !== `\\` && char === `"`) {
            if (char === "\"" && lastChar !== `\\`) {
                state.inDString = true;
            }
        }
        else if (lastChar === "/" && char === "/") {
            state.inSComment = true;
            parsedChars.pop();
            lastChar = char;
            continue;
        }
        lastChar = char;
        parsedChars.push(char);
    }
    return parsedChars.join("");
}
/**Cleans a line by removing trailing/leading whitespaces/tabs, and comments. */
export function cleanLine(line) {
    return removeTrailingSpaces(removeComments(line));
}
export function lexProgram(program) {
    const lines = program.map(cleanLine).filter(line => line).map(line => lexLine(line));
    return { lines };
}
