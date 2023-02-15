import { lexemeTypes } from "../data.js";
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
export function lexLine(line) {
    return {
        lexemes: splitLineOnSpace(line).map(chunk => {
            if (chunk.match(/^[a-z]{3}$/i))
                return { type: "instruction", value: chunk };
            if (chunk.match(/^\d+$/i))
                return { type: "number", value: chunk };
            if (chunk.match(/^\w+\:$/i))
                return { type: "label", value: chunk };
            throw new Error(`Invalid chunk ${chunk} in line ${line}`);
        }),
        rawText: line
    };
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
    for (const char of charsplitInput) {
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
