/** Copyright © BalaM314, 2024. MIT License. */

import { statements } from "../data.js";
import { lexProgram } from "./lexer.js";
import type {
	ProcessedLine, MemoryLoadInstructions, LexedProgram, ProcessedProgram, LexedLine, StatementDefinition, Lexeme, MemoryValue
} from "./types.js";



export function assembleProgram(program:string[]):MemoryLoadInstructions {
	return compileMemoryLoadInstructions(
		processProgram(
			lexProgram(
				program
			)
		).lines.map(line => line.statementDefinition.getOutput(line))
	);
	
}

export function compileMemoryLoadInstructions(values:MemoryValue[]):MemoryLoadInstructions {
	let instructions:MemoryLoadInstructions = [[0, []]];
	for(const {address, value} of values){
		if(address != undefined) instructions.push([address, [value]]);
		else instructions.at(-1)![1].push(value);
	}
	return instructions;
}

export function processProgram(lexedProgram:LexedProgram):ProcessedProgram {
	const lines:ProcessedLine[] = [];
	for(const line of lexedProgram.lines){
		const def = getStatementDefinition(line);
		if(def == null) throw new Error(`Invalid line "${line.rawText}"`);
		lines.push(def[1]);
	}
	return { lines };
}

export function lineMatches(line:LexedLine, statement:StatementDefinition):false | ProcessedLine {
	//TODO this implementation is questionable
	if(line.lexemes.length > statement.maxLexemes) return false; //Too many lexemes
	if(line.lexemes.length < statement.minLexemes) return false; //Not enough lexemes
	const lineCopy = line.lexemes.slice();
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
		statementDefinition: statement, lexemes: assignedLine, rawText: line.rawText
	};
}

export function getStatementDefinitions(line:LexedLine):[StatementDefinition, ProcessedLine][] {
	return Object.values(statements).map(def => [def, lineMatches(line, def)] as [StatementDefinition, ProcessedLine]).filter(([def, result]) => result);
}

export function getStatementDefinition(line:LexedLine):[StatementDefinition, ProcessedLine] | null {
	return getStatementDefinitions(line)[0] ?? null;
}
