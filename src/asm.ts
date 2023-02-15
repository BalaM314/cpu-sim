import { instructionMapping } from "./cpu.js";

export interface LexedProgram {
	lines: LexedLine[];
}
export type LexedLine = Lexeme[];
const lexemeTypes = ["number", "instruction", "label"] as const;
export type LexemeType = (typeof lexemeTypes) extends ReadonlyArray<infer T> ? T : never;
export type MemoryLoadInstructions = [index:number, values:number[]][];
export type MemoryValue = {address?: number, value: number};
export interface Lexeme {
	value: string;
	type: LexemeType;
}

export interface LexemeMatcher {
	matcher: (lexeme:Lexeme) => boolean;
	isOptional: boolean;
}

export interface ProcessedProgram {
	lines: ProcessedLine[];
}
export interface ProcessedLine {
	statementDefinition:StatementDefinition;
	lexemes: (Lexeme | null)[];
}

export interface StatementDefinition {
	lexemeMatchers: LexemeMatcher[];
	minLexemes: number;
	maxLexemes: number;
	getOutput(line:ProcessedLine):MemoryValue;
}

export function processLexemeMatcherString(str:string):LexemeMatcher {
	let slicedStr:string, isOptional:boolean;
	if(str.endsWith("?")){
		slicedStr = str.slice(0, -1);
		isOptional = true;
	} else {
		slicedStr = str;
		isOptional = false;
	}
	if(slicedStr.includes("|")){
		const types = slicedStr.split("|");
		types.forEach(type => {
			if(!lexemeTypes.includes(type as any)) throw new Error(`Invalid lexeme matcher string, this is an error with cpu-sim`);
		});
		return {
			matcher: lexeme => types.includes(lexeme.type),
			isOptional
		};
	} else {
		return {
			matcher: lexeme => slicedStr == lexeme.type,
			isOptional
		};
	}
}

export const statements = (statements => Object.fromEntries(
	Object.entries(statements)
	.map(([k, v]) => [k, {
		...v,
		lexemeMatchers: v.lexemes.map(processLexemeMatcherString)
	}] as const).map(([k, v]) => [k, {
		...v,
		maxLexemes: v.lexemeMatchers.length,
		minLexemes: v.lexemeMatchers.filter(m => !m.isOptional).length
	}])
))({
	instruction: {
		lexemes: ["number|label?", "instruction", "number?"],
		getOutput(line:ProcessedLine):MemoryValue {
			const instruction = line.lexemes[1]!.value;
			const id = instructionMapping.get(instruction);
			if(id == undefined) throw new Error(`Invalid instruction ${instruction}`);
			return {
				address: line.lexemes[0]?.type == "number" ? + line.lexemes[0].value : undefined,
				value: (+id << 8) + +(line.lexemes[2]?.value ?? 0)
			}
		}
	},
	memoryValue: {
		lexemes: ["number|label?", "number"],
		getOutput(line:ProcessedLine):MemoryValue {
			return {
				address: line.lexemes[0]?.type == "number" ? + line.lexemes[0].value : undefined,
				value: +(line.lexemes[1]!.value)
			}
		}
	}
});

export function assembleProgram(program:string[]):MemoryLoadInstructions {
	const lexedProgram = lexProgram(program);
	const processedProgram = processProgram(lexedProgram);
	const memoryValues = processedProgram.lines.map(line => line.statementDefinition.getOutput(line));
	const memoryLoadInstructions = memoryValues.reduce((acc, val) => {
		if(val.address != undefined)
			acc.push([val.address, [val.value]]);
		else
			acc.at(-1)![1].push(val.value);
		return acc;
	}, [[0, []]] as MemoryLoadInstructions);
	return memoryLoadInstructions;
	
}

export function processProgram(lexedProgram:LexedProgram):ProcessedProgram {
	const lines:ProcessedLine[] = [];
	for(const line of lexedProgram.lines){
		const def = getStatementDefinition(line);
		if(def == null) throw new Error(`Invalid line ${line.map(l => l.value).join(" ")}`);//TODO include text in lexedline
		lines.push(def[1]);
	}
	return { lines };
}

export function lineMatches(line:LexedLine, statement:StatementDefinition):false | ProcessedLine {
	if(line.length > statement.maxLexemes) return false; //Too many lexemes
	if(line.length < statement.minLexemes) return false; //Not enough lexemes
	const lineCopy = line.slice();
	const assignedLine:(Lexeme | null)[] = [];
	for(const [i, matcher] of statement.lexemeMatchers.entries()){
		const lexeme = lineCopy[0] as Lexeme | undefined;
		if(lexeme && matcher.matcher(lexeme)){
			lineCopy.shift();
			assignedLine.push(lexeme);
		} else if(matcher.isOptional){
			assignedLine.push(null);
		} else if(!lexeme){
			return false;
			//Not enough lexemes
		} else {
			return false;
			//`Required matcher ${matcher.matcher.toString()} did not match lexeme ${lexeme}`
		}
	}
	if(lineCopy.length > 0) return false; //Too many lexemes
	return {
		statementDefinition: statement, lexemes: assignedLine
	};
}

export function getStatementDefinitions(line:LexedLine):[StatementDefinition, ProcessedLine][] {
	return Object.values(statements).map(def => [def, lineMatches(line, def)] as [StatementDefinition, ProcessedLine]).filter(([def, result]) => result);
}

export function getStatementDefinition(line:LexedLine):[StatementDefinition, ProcessedLine] | null {
	return getStatementDefinitions(line)[0] ?? null;
}

export function splitLineOnSpace(line:string):string[] {
	if(line.includes(`"`)){
		const chunks:string[] = [""];
		let isInString = false;
		for(const char of line){
			if(char == `"`){
				isInString = !isInString;
			}
			if(!isInString && char == " "){
				chunks.push("");
			} else {
				chunks[chunks.length - 1] += char;
			}
		}
		if(isInString) throw new Error("unterminated string literal");
		return chunks;
	} else {
		return line.split(" ");
	}
}

export function lexLine(line:string):LexedLine {
	return splitLineOnSpace(line).map(chunk => {
		if(chunk.match(/^[a-z]{3}$/i)) return { type: "instruction", value: chunk };
		if(chunk.match(/^\d+$/i)) return { type: "number", value: chunk };
		if(chunk.match(/^\w+\:$/i)) return { type: "label", value: chunk };
		throw new Error(`Invalid chunk ${chunk} in line ${line}`);
	})
}

/**Removes trailing/leading whitespaces and tabs from a line. */
export function removeTrailingSpaces(line:string):string {
	return line
		.replace(/(^[ \t]+)|([ \t]+$)/g, "");
}

/**Removes single line and multiline comments from a line. */
export function removeComments(line:string):string {
	const charsplitInput = line.split("");
	const parsedChars = [];

	let lastChar = "";
	const state = {
		inSComment: false,
		inMComment: false,
		inDString: false
	};
	for(const _char in charsplitInput){
		const char = charsplitInput[_char];
		if(typeof char !== "string") continue;
		if(state.inSComment){
			if(char === "\n"){
				state.inSComment = false;
			}
			lastChar = char;
			continue;
		} else if(state.inMComment) {
			if(lastChar === "*" && char === "/"){
				state.inMComment = false;
			}
			lastChar = char;
			continue;
		} else if(state.inDString) {
			if(lastChar !== `\\` && char === `"`){
				state.inDString = false;
			}
		} else if(char === "#"){
			state.inSComment = true;
			lastChar = char;
			continue;
			//skip characters until next newline
		} else if(lastChar === "/" && char === "*"){
			state.inMComment = true;
			parsedChars.pop();
			lastChar = char;
			continue;
			//skip characters until "*/"
		} else if(lastChar !== `\\` && char === `"`){
			if(char === "\"" && lastChar !== `\\`){
				state.inDString = true;
			}
		} else if(lastChar === "/" && char === "/"){
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
export function cleanLine(line:string):string {
	return removeTrailingSpaces(removeComments(line));
}

export function lexProgram(program:string[]):LexedProgram {
	const lines = program.map(cleanLine).filter(line => line).map(line => lexLine(line));
	return { lines };
}
