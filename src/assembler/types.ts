import type { lexemeTypes } from "../data.js";

export interface LexedProgram {
	lines: LexedLine[];
}
export type LexedLine = Lexeme[];
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