/** Copyright © BalaM314, 2023. */

import "jasmine";
import type { LexedLine, ProcessedLine } from "../src/assembler/types.js";
import { statements } from "../src/data.js";
import { processProgram, lineMatches, getStatementDefinition } from "../src/assembler/assembler.js";
import { lexLine, lexProgram, processLexemeMatcherString } from "../src/assembler/lexer.js";






describe("lexLine", () => {
	it("should convert a line to lexemes", () => {
		expect(lexLine("NOP").lexemes).toEqual([
			{ type: "instruction", value: "NOP" }
		]);
		expect(lexLine("JPE 7").lexemes).toEqual([
			{ type: "instruction", value: "JPE" },
			{ type: "number", value: "7" },
		]);
		expect(lexLine("0 LDD 51").lexemes).toEqual([
			{ type: "number", value: "0" },
			{ type: "instruction", value: "LDD" },
			{ type: "number", value: "51" },
		]);
		expect(lexLine("jumped: ADD 51").lexemes).toEqual([
			{ type: "label", value: "jumped:" },
			{ type: "instruction", value: "ADD" },
			{ type: "number", value: "51" },
		]);
	});
});

describe("lexProgram", () => {
	it("should convert a program to lexemes", () => {
		expect(lexProgram(
`0 NOP
1 LDD 50
ADD 51
CMP 52
JPE 7
STO 41
END
label: NOP
END
50 2
51 2
52 4`
.split("\n")
		).lines.map(l => l.lexemes)).toEqual([
			[{ type: "number", value: "0"}, { type: "instruction", value: "NOP" }],
			[{ type: "number", value: "1"}, { type: "instruction", value: "LDD" }, { type: "number", value: "50" }],
			[{ type: "instruction", value: "ADD" }, { type: "number", value: "51" }],
			[{ type: "instruction", value: "CMP" }, { type: "number", value: "52" }],
			[{ type: "instruction", value: "JPE" }, { type: "number", value: "7" }],
			[{ type: "instruction", value: "STO" }, { type: "number", value: "41" }],
			[{ type: "instruction", value: "END" }],
			[{ type: "label", value: "label:" }, { type: "instruction", value: "NOP" }],
			[{ type: "instruction", value: "END" }],
			[{ type: "number", value: "50" }, { type: "number", value: "2" }],
			[{ type: "number", value: "51" }, { type: "number", value: "2" }],
			[{ type: "number", value: "52" }, { type: "number", value: "4" }],
		])
	});
});

describe("processProgram", () => {
	it("should process a lexed program", () => {
		expect(processProgram({lines: [
			[{ type: "number", value: "0"}, { type: "instruction", value: "NOP" }],
			[{ type: "number", value: "1"}, { type: "instruction", value: "LDD" }, { type: "number", value: "50" }],
			[{ type: "instruction", value: "ADD" }, { type: "number", value: "51" }],
			[{ type: "instruction", value: "CMP" }, { type: "number", value: "52" }],
			[{ type: "instruction", value: "JPE" }, { type: "number", value: "7" }],
			[{ type: "instruction", value: "STO" }, { type: "number", value: "41" }],
			[{ type: "instruction", value: "END" }],
			[{ type: "label", value: "label:" }, { type: "instruction", value: "NOP" }],
			[{ type: "instruction", value: "END" }],
			[{ type: "number", value: "50" }, { type: "number", value: "2" }],
			[{ type: "number", value: "51" }, { type: "number", value: "2" }],
			[{ type: "number", value: "52" }, { type: "number", value: "4" }],
		].map(lexemes => ({lexemes, rawText: lexemes.map(l => l.value).join(" ")} as LexedLine))})).toEqual({lines: [
			{statementDefinition: statements.instruction, lexemes: [{ type: "number", value: "0"}, { type: "instruction", value: "NOP" }, null], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [{ type: "number", value: "1"}, { type: "instruction", value: "LDD" }, { type: "number", value: "50" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", value: "ADD" }, { type: "number", value: "51" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", value: "CMP" }, { type: "number", value: "52" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", value: "JPE" }, { type: "number", value: "7" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", value: "STO" }, { type: "number", value: "41" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", value: "END" }, null], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [{ type: "label", value: "label:" }, { type: "instruction", value: "NOP" }, null], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", value: "END" }, null], rawText: jasmine.any(String)},
			{statementDefinition: statements.memoryValue, lexemes: [{ type: "number", value: "50" }, { type: "number", value: "2" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.memoryValue, lexemes: [{ type: "number", value: "51" }, { type: "number", value: "2" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.memoryValue, lexemes: [{ type: "number", value: "52" }, { type: "number", value: "4" }], rawText: jasmine.any(String)},
		]});
	});
});

describe("processLexemeMatcherString", () => {
	it("should process regular lexeme strings into lexeme matchers", () => {
		const matcher = processLexemeMatcherString("instruction");
		expect(matcher.matcher({type: "instruction", value: "nop"})).toEqual(true);
		expect(matcher.matcher({type: "number", value: "23"})).toEqual(false);
		const matcher2 = processLexemeMatcherString("number");
		expect(matcher2.matcher({type: "number", value: "23"})).toEqual(true);
		expect(matcher2.matcher({type: "instruction", value: "nop"})).toEqual(false);
	});
	it("should process optional lexeme strings into lexeme matchers", () => {
		const matcher = processLexemeMatcherString("instruction?");
		expect(matcher.isOptional).toEqual(true);
		const matcher2 = processLexemeMatcherString("instruction|number?");
		expect(matcher2.isOptional).toEqual(true);
		const matcher3 = processLexemeMatcherString("instruction");
		expect(matcher3.isOptional).toEqual(false);
		const matcher4 = processLexemeMatcherString("instruction|number");
		expect(matcher4.isOptional).toEqual(false);
	});
	it("should process or lexeme strings into lexeme matchers", () => {
		const matcher = processLexemeMatcherString("instruction|number");
		expect(matcher.matcher({type: "instruction", value: "nop"})).toEqual(true);
		expect(matcher.matcher({type: "number", value: "23"})).toEqual(true);
		expect(matcher.matcher({type: "label", value: "thing:"})).toEqual(false);
		const matcher2 = processLexemeMatcherString("label|number|instruction");
		expect(matcher2.matcher({type: "instruction", value: "nop"})).toEqual(true);
		expect(matcher2.matcher({type: "number", value: "23"})).toEqual(true);
		expect(matcher2.matcher({type: "label", value: "thing:"})).toEqual(true);
	});
});

describe("lineMatches", () => {
	it("should determine if a line matches a statement definition", () => {
		const anyProcessedLine = {lexemes: jasmine.any(Array), statementDefinition: jasmine.any(Object), rawText: jasmine.any(String)} as jasmine.ExpectedRecursive<ProcessedLine>;
		expect(lineMatches({rawText: "", lexemes: [{ type: "number", value: "0"}, { type: "instruction", value: "NOP" }]}, statements.instruction)).toEqual(anyProcessedLine);
		expect(lineMatches({rawText: "", lexemes: [{ type: "label", value: "sus:"}, { type: "instruction", value: "NOP" }]}, statements.instruction)).toEqual(anyProcessedLine);
		expect(lineMatches({rawText: "", lexemes: [{ type: "label", value: "sus:"}, { type: "instruction", value: "ADD" }, { type: "number", value: "23"},]}, statements.instruction)).toEqual(anyProcessedLine);
		expect(lineMatches({rawText: "", lexemes: [{ type: "number", value: "0"}, { type: "instruction", value: "ADD" }, { type: "number", value: "23"},]}, statements.instruction)).toEqual(anyProcessedLine);
		expect(lineMatches({rawText: "", lexemes: [{ type: "label", value: "sus:"}]}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: [{ type: "label", value: "sus:"}, { type: "instruction", value: "NOP" }, { type: "instruction", value: "NOP" }]}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: [{ type: "instruction", value: "ADD" }, { type: "label", value: "sus:" }]}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: [{ type: "number", value: "0"}, { type: "number", value: "23"},]}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: []}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: [{ type: "number", value: "0"}]}, statements.instruction)).toEqual(false);
	});
});

describe("getStatementDefinition", () => {
	it("should determine the statement definition that a line matches", () => {
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "number", value: "0"}, { type: "instruction", value: "NOP" }]})?.[0]).toEqual(statements.instruction);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "label", value: "sus:"}, { type: "instruction", value: "NOP" }]})?.[0]).toEqual(statements.instruction);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "label", value: "sus:"}, { type: "instruction", value: "ADD" }, { type: "number", value: "23"},]})?.[0]).toEqual(statements.instruction);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "number", value: "0"}, { type: "instruction", value: "ADD" }, { type: "number", value: "23"},]})?.[0]).toEqual(statements.instruction);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "label", value: "sus:"}]})).toEqual(null);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "label", value: "sus:"}, { type: "instruction", value: "NOP" }, { type: "instruction", value: "NOP" }]})).toEqual(null);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "instruction", value: "ADD" }, { type: "label", value: "sus:" }]})).toEqual(null);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "number", value: "0"}, { type: "number", value: "23"}]})?.[0]).toEqual(statements.memoryValue);
		expect(getStatementDefinition({rawText: "", lexemes: []})).toEqual(null);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "number", value: "0"}]})).toEqual(null);
	});
});

