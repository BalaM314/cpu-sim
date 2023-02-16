/** Copyright © BalaM314, 2023. */

import type { lexemeTypes } from "../data.js";

export interface LexedProgram {
	lines: LexedLine[];
}
export type LexedLine = {
	lexemes: Lexeme[];
	rawText: string;
};
export type LexemeType = (typeof lexemeTypes) extends ReadonlyArray<infer T> ? T : never;
export type MemoryLoadInstructions = [index:number, values:number[]][];
export type MemoryValue = {address?: number, value: number};
export interface Lexeme {
	text: string;
	value?: number;
	variant?: string;
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
	rawText: string;
}

export interface StatementDefinition {
	lexemeMatchers: LexemeMatcher[];
	minLexemes: number;
	maxLexemes: number;
	getOutput(line:ProcessedLine):MemoryValue;
}