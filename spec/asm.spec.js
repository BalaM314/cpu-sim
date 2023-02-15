import "jasmine";
import { getStatementDefinition, lexLine, lexProgram, lineMatches, processLexemeMatcherString, processProgram, statements } from "../src/asm.js";
describe("lexLine", () => {
    it("should convert a line to lexemes", () => {
        expect(lexLine("NOP")).toEqual([
            { type: "instruction", value: "NOP" }
        ]);
        expect(lexLine("JPE 7")).toEqual([
            { type: "instruction", value: "JPE" },
            { type: "number", value: "7" },
        ]);
        expect(lexLine("0 LDD 51")).toEqual([
            { type: "number", value: "0" },
            { type: "instruction", value: "LDD" },
            { type: "number", value: "51" },
        ]);
        expect(lexLine("jumped: ADD 51")).toEqual([
            { type: "label", value: "jumped:" },
            { type: "instruction", value: "ADD" },
            { type: "number", value: "51" },
        ]);
    });
});
describe("lexProgram", () => {
    it("should convert a program to lexemes", () => {
        expect(lexProgram(`0 NOP
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
            .split("\n"))).toEqual({
            lines: [
                [{ type: "number", value: "0" }, { type: "instruction", value: "NOP" }],
                [{ type: "number", value: "1" }, { type: "instruction", value: "LDD" }, { type: "number", value: "50" }],
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
            ]
        });
    });
});
describe("processProgram", () => {
    it("should process a lexed program", () => {
        expect(processProgram({ lines: [
                [{ type: "number", value: "0" }, { type: "instruction", value: "NOP" }],
                [{ type: "number", value: "1" }, { type: "instruction", value: "LDD" }, { type: "number", value: "50" }],
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
            ] })).toEqual({ lines: [] });
    });
});
describe("processLexemeMatcherString", () => {
    it("should process regular lexeme strings into lexeme matchers", () => {
        const matcher = processLexemeMatcherString("instruction");
        expect(matcher.matcher({ type: "instruction", value: "nop" })).toEqual(true);
        expect(matcher.matcher({ type: "number", value: "23" })).toEqual(false);
        const matcher2 = processLexemeMatcherString("number");
        expect(matcher2.matcher({ type: "number", value: "23" })).toEqual(true);
        expect(matcher2.matcher({ type: "instruction", value: "nop" })).toEqual(false);
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
        expect(matcher.matcher({ type: "instruction", value: "nop" })).toEqual(true);
        expect(matcher.matcher({ type: "number", value: "23" })).toEqual(true);
        expect(matcher.matcher({ type: "label", value: "thing:" })).toEqual(false);
        const matcher2 = processLexemeMatcherString("label|number|instruction");
        expect(matcher2.matcher({ type: "instruction", value: "nop" })).toEqual(true);
        expect(matcher2.matcher({ type: "number", value: "23" })).toEqual(true);
        expect(matcher2.matcher({ type: "label", value: "thing:" })).toEqual(true);
    });
});
describe("lineMatches", () => {
    it("should determine if a line matches a statement definition", () => {
        const anyProcessedLine = { lexemes: jasmine.any(Array), statementDefinition: jasmine.any(Object) };
        expect(lineMatches([{ type: "number", value: "0" }, { type: "instruction", value: "NOP" }], statements.instruction)).toEqual(anyProcessedLine);
        expect(lineMatches([{ type: "label", value: "sus:" }, { type: "instruction", value: "NOP" }], statements.instruction)).toEqual(anyProcessedLine);
        expect(lineMatches([{ type: "label", value: "sus:" }, { type: "instruction", value: "ADD" }, { type: "number", value: "23" },], statements.instruction)).toEqual(anyProcessedLine);
        expect(lineMatches([{ type: "number", value: "0" }, { type: "instruction", value: "ADD" }, { type: "number", value: "23" },], statements.instruction)).toEqual(anyProcessedLine);
        expect(lineMatches([{ type: "label", value: "sus:" }], statements.instruction)).toEqual(false);
        expect(lineMatches([{ type: "label", value: "sus:" }, { type: "instruction", value: "NOP" }, { type: "instruction", value: "NOP" }], statements.instruction)).toEqual(false);
        expect(lineMatches([{ type: "instruction", value: "ADD" }, { type: "label", value: "sus:" }], statements.instruction)).toEqual(false);
        expect(lineMatches([{ type: "number", value: "0" }, { type: "number", value: "23" },], statements.instruction)).toEqual(false);
        expect(lineMatches([], statements.instruction)).toEqual(false);
        expect(lineMatches([{ type: "number", value: "0" }], statements.instruction)).toEqual(false);
    });
});
describe("getStatementDefinition", () => {
    it("should determine the statement definition that a line matches", () => {
        var _a, _b, _c, _d;
        expect((_a = getStatementDefinition([{ type: "number", value: "0" }, { type: "instruction", value: "NOP" }])) === null || _a === void 0 ? void 0 : _a[0]).toEqual(statements.instruction);
        expect((_b = getStatementDefinition([{ type: "label", value: "sus:" }, { type: "instruction", value: "NOP" }])) === null || _b === void 0 ? void 0 : _b[0]).toEqual(statements.instruction);
        expect((_c = getStatementDefinition([{ type: "label", value: "sus:" }, { type: "instruction", value: "ADD" }, { type: "number", value: "23" },])) === null || _c === void 0 ? void 0 : _c[0]).toEqual(statements.instruction);
        expect((_d = getStatementDefinition([{ type: "number", value: "0" }, { type: "instruction", value: "ADD" }, { type: "number", value: "23" },])) === null || _d === void 0 ? void 0 : _d[0]).toEqual(statements.instruction);
        expect(getStatementDefinition([{ type: "label", value: "sus:" }])).toEqual(null);
        expect(getStatementDefinition([{ type: "label", value: "sus:" }, { type: "instruction", value: "NOP" }, { type: "instruction", value: "NOP" }])).toEqual(null);
        expect(getStatementDefinition([{ type: "instruction", value: "ADD" }, { type: "label", value: "sus:" }])).toEqual(null);
        expect(getStatementDefinition([{ type: "number", value: "0" }, { type: "number", value: "23" },])).toEqual(null);
        expect(getStatementDefinition([])).toEqual(null);
        expect(getStatementDefinition([{ type: "number", value: "0" }])).toEqual(null);
    });
});
