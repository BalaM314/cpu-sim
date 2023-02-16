/** Copyright © BalaM314, 2023. */

import "jasmine";
import type { LexedLine, ProcessedLine } from "../src/assembler/types.js";
import { statements } from "../src/data.js";
import { processProgram, lineMatches, getStatementDefinition } from "../src/assembler/assembler.js";
import { lexLine, lexProgram, processLexemeMatcherString } from "../src/assembler/lexer.js";






describe("lexLine", () => {
	it("should convert a line to lexemes", () => {
		expect(lexLine("NOP").lexemes).toEqual([
			{ type: "instruction", text: "NOP" }
		]);
		expect(lexLine("JPE 7").lexemes).toEqual([
			{ type: "instruction", text: "JPE" },
			{ type: "number", variant: "hex", text: "7", value: 7},
		]);
		expect(lexLine("0 LDD #51").lexemes).toEqual([
			{ type: "number", variant: "hex", text: "0", value: 0 },
			{ type: "instruction", text: "LDD" },
			{ type: "number", variant: "denary", text: "#51", value: 51},
		]);
		expect(lexLine("jumped: ADD 51").lexemes).toEqual([
			{ type: "label", text: "jumped:" },
			{ type: "instruction", text: "ADD" },
			{ type: "number", variant: "hex", text: "51", value: 81},
		]);
	});
});

describe("lexProgram", () => {
	it("should convert a program to lexemes", () => {
		expect(lexProgram(
`0 NOP
1 LDM #2
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
			[{ type: "number", variant: "hex", text: "0", value: 0}, { type: "instruction", text: "NOP" }],
			[{ type: "number", variant: "hex", text: "1", value: 1}, { type: "instruction", text: "LDM" }, { type: "number", variant: "denary", text: "#2", value: 2}],
			[{ type: "instruction", text: "ADD" }, { type: "number", variant: "hex", text: "51", value: 81}],
			[{ type: "instruction", text: "CMP" }, { type: "number", variant: "hex", text: "52", value: 82}],
			[{ type: "instruction", text: "JPE" }, { type: "number", variant: "hex", text: "7", value: 7}],
			[{ type: "instruction", text: "STO" }, { type: "number", variant: "hex", text: "41", value: 65}],
			[{ type: "instruction", text: "END" }],
			[{ type: "label", text: "label:" }, { type: "instruction", text: "NOP" }],
			[{ type: "instruction", text: "END" }],
			[{ type: "number", variant: "hex", text: "50", value: 80}, { type: "number", variant: "hex", text: "2", value: 2}],
			[{ type: "number", variant: "hex", text: "51", value: 81}, { type: "number", variant: "hex", text: "2", value: 2}],
			[{ type: "number", variant: "hex", text: "52", value: 82}, { type: "number", variant: "hex", text: "4", value: 4}],
		])
	});
});

describe("processProgram", () => {
	it("should process a lexed program", () => {
		expect(processProgram({lines: [
			[{ type: "number", text: "0"}, { type: "instruction", text: "NOP" }],
			[{ type: "number", text: "1"}, { type: "instruction", text: "LDM" }, { type: "number", text: "#2" }],
			[{ type: "instruction", text: "ADD" }, { type: "number", text: "51" }],
			[{ type: "instruction", text: "CMP" }, { type: "number", text: "52" }],
			[{ type: "instruction", text: "JPE" }, { type: "number", text: "7" }],
			[{ type: "instruction", text: "STO" }, { type: "number", text: "41" }],
			[{ type: "instruction", text: "END" }],
			[{ type: "label", text: "label:" }, { type: "instruction", text: "NOP" }],
			[{ type: "instruction", text: "END" }],
			[{ type: "number", text: "50" }, { type: "number", text: "2" }],
			[{ type: "number", text: "51" }, { type: "number", text: "2" }],
			[{ type: "number", text: "52" }, { type: "number", text: "4" }],
		].map(lexemes => ({lexemes, rawText: lexemes.map(l => l.text).join(" ")} as LexedLine))})).toEqual({lines: [
			{statementDefinition: statements.instruction, lexemes: [{ type: "number", text: "0"}, { type: "instruction", text: "NOP" }, null], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [{ type: "number", text: "1"}, { type: "instruction", text: "LDM" }, { type: "number", text: "#2" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", text: "ADD" }, { type: "number", text: "51" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", text: "CMP" }, { type: "number", text: "52" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", text: "JPE" }, { type: "number", text: "7" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", text: "STO" }, { type: "number", text: "41" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", text: "END" }, null], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [{ type: "label", text: "label:" }, { type: "instruction", text: "NOP" }, null], rawText: jasmine.any(String)},
			{statementDefinition: statements.instruction, lexemes: [null, { type: "instruction", text: "END" }, null], rawText: jasmine.any(String)},
			{statementDefinition: statements.memoryValue, lexemes: [{ type: "number", text: "50" }, { type: "number", text: "2" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.memoryValue, lexemes: [{ type: "number", text: "51" }, { type: "number", text: "2" }], rawText: jasmine.any(String)},
			{statementDefinition: statements.memoryValue, lexemes: [{ type: "number", text: "52" }, { type: "number", text: "4" }], rawText: jasmine.any(String)},
		]});
	});
});

describe("processLexemeMatcherString", () => {
	it("should process regular lexeme strings into lexeme matchers", () => {
		const matcher = processLexemeMatcherString("instruction");
		expect(matcher.matcher({type: "instruction", text: "NOP"})).toEqual(true);
		expect(matcher.matcher({type: "number", text: "23"})).toEqual(false);
		const matcher2 = processLexemeMatcherString("number");
		expect(matcher2.matcher({type: "number", text: "23"})).toEqual(true);
		expect(matcher2.matcher({type: "instruction", text: "NOP"})).toEqual(false);
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
		expect(matcher.matcher({type: "instruction", text: "nop"})).toEqual(true);
		expect(matcher.matcher({type: "number", text: "23"})).toEqual(true);
		expect(matcher.matcher({type: "label", text: "thing:"})).toEqual(false);
		const matcher2 = processLexemeMatcherString("label|number|instruction");
		expect(matcher2.matcher({type: "instruction", text: "nop"})).toEqual(true);
		expect(matcher2.matcher({type: "number", variant: "denary", text: "#23", value: 23})).toEqual(true);
		expect(matcher2.matcher({type: "number", variant: "hex", value: 0x4F, text: "4F"})).toEqual(true);
		expect(matcher2.matcher({type: "register", text: "ACC"})).toEqual(false);
		expect(matcher2.matcher({type: "label", text: "thing:"})).toEqual(true);
	});
});

describe("lineMatches", () => {
	it("should determine if a line matches a statement definition", () => {
		const anyProcessedLine = {lexemes: jasmine.any(Array), statementDefinition: jasmine.any(Object), rawText: jasmine.any(String)} as jasmine.ExpectedRecursive<ProcessedLine>;
		expect(lineMatches({rawText: "", lexemes: [{ type: "number", text: "0"}, { type: "instruction", text: "NOP" }]}, statements.instruction)).toEqual(anyProcessedLine);
		expect(lineMatches({rawText: "", lexemes: [{ type: "label", text: "sus:"}, { type: "instruction", text: "NOP" }]}, statements.instruction)).toEqual(anyProcessedLine);
		expect(lineMatches({rawText: "", lexemes: [{ type: "label", text: "sus:"}, { type: "instruction", text: "ADD" }, { type: "number", text: "23"},]}, statements.instruction)).toEqual(anyProcessedLine);
		expect(lineMatches({rawText: "", lexemes: [{ type: "number", text: "0"}, { type: "instruction", text: "ADD" }, { type: "number", text: "23"},]}, statements.instruction)).toEqual(anyProcessedLine);
		expect(lineMatches({rawText: "", lexemes: [{ type: "label", text: "sus:"}]}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: [{ type: "label", text: "sus:"}, { type: "instruction", text: "NOP" }, { type: "instruction", text: "NOP" }]}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: [{ type: "instruction", text: "ADD" }, { type: "label", text: "sus:" }]}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: [{ type: "number", text: "0"}, { type: "number", text: "23"},]}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: []}, statements.instruction)).toEqual(false);
		expect(lineMatches({rawText: "", lexemes: [{ type: "number", text: "0"}]}, statements.instruction)).toEqual(false);
	});
});

describe("getStatementDefinition", () => {
	it("should determine the statement definition that a line matches", () => {
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "number", text: "0"}, { type: "instruction", text: "NOP" }]})?.[0]).toEqual(statements.instruction);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "label", text: "sus:"}, { type: "instruction", text: "NOP" }]})?.[0]).toEqual(statements.instruction);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "label", text: "sus:"}, { type: "instruction", text: "ADD" }, { type: "number", text: "23"},]})?.[0]).toEqual(statements.instruction);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "number", text: "0"}, { type: "instruction", text: "ADD" }, { type: "number", text: "23"},]})?.[0]).toEqual(statements.instruction);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "label", text: "sus:"}]})).toEqual(null);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "label", text: "sus:"}, { type: "instruction", text: "NOP" }, { type: "instruction", text: "NOP" }]})).toEqual(null);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "instruction", text: "ADD" }, { type: "label", text: "sus:" }]})).toEqual(null);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "number", text: "0"}, { type: "number", text: "23"}]})?.[0]).toEqual(statements.memoryValue);
		expect(getStatementDefinition({rawText: "", lexemes: []})).toEqual(null);
		expect(getStatementDefinition({rawText: "", lexemes: [{ type: "number", text: "0"}]})).toEqual(null);
	});
});

