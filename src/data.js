/** Copyright © BalaM314, 2023. */
import { processLexemeMatcherString } from "./assembler/lexer.js";
export const lexemeTypes = ["number", "instruction", "label", "register"];
export const instructions = {
    [0x00]: { code: "END", exec(executor) { executor.on = false; return {}; } },
    [0x10]: { code: "NOP", exec() { return {}; } },
    [0x20]: { code: "JPA", exec(executor, operand) { executor.instructionPointer = operand; return { instructionPointerModified: true }; } },
    [0x21]: { code: "JPE", exec(executor, operand) {
            if (executor.flags.compare) {
                executor.instructionPointer = operand;
                return { instructionPointerModified: true };
            }
            else
                return {};
        } },
    [0x22]: { code: "JPN", exec(executor, operand) {
            if (!executor.flags.compare) {
                executor.instructionPointer = operand;
                return { instructionPointerModified: true };
            }
            else
                return {};
        } },
    [0x30]: { code: "LDM", exec(executor, operand) { executor.registers.ACC = operand; return {}; } },
    [0x31]: { code: "LDD", exec(executor, operand) { executor.registers.ACC = executor.mem.read(operand); return {}; } },
    [0x32]: { code: "LDI", exec(executor, operand) { executor.registers.ACC = executor.mem.read(executor.mem.read(operand)); return {}; } },
    [0x40]: { code: "STO", exec(executor, operand) { executor.mem.write(operand, executor.registers.ACC); return {}; } },
    [0x50]: { code: "ADD", exec(executor, operand) { executor.registers.ACC += executor.mem.read(operand); return {}; } },
    [0x51]: { code: "SUB", exec(executor, operand) { executor.registers.ACC -= executor.mem.read(operand); return {}; } },
    [0x52]: { code: "MUL", exec(executor, operand) { executor.registers.ACC *= executor.mem.read(operand); return {}; } },
    [0x53]: { code: "DIV", exec(executor, operand) { executor.registers.ACC = Math.trunc(executor.registers.ACC / executor.mem.read(operand)); return {}; } },
    [0x54]: { code: "INC", exec(executor, operand) { executor.registers.ACC++; return {}; } },
    [0x55]: { code: "AND", exec(executor, operand) { executor.registers.ACC &= executor.mem.read(operand); return {}; } },
    [0x56]: { code: "ORD", exec(executor, operand) { executor.registers.ACC |= executor.mem.read(operand); return {}; } },
    [0x57]: { code: "XOR", exec(executor, operand) { executor.registers.ACC ^= executor.mem.read(operand); return {}; } },
    [0x60]: { code: "CMP", exec(executor, operand) { executor.flags.compare = executor.registers.ACC == executor.mem.read(operand); return {}; } },
    [0x61]: { code: "SLT", exec(executor, operand) { executor.flags.compare = executor.registers.ACC < executor.mem.read(operand); return {}; } },
    [0x62]: { code: "SGT", exec(executor, operand) { executor.flags.compare = executor.registers.ACC > executor.mem.read(operand); return {}; } },
    [0xFF]: { code: "", exec(executor, operand, opcode) {
            executor.on = false;
            console.warn(`Invalid instruction at 0x${executor.instructionPointer.toString(16)} (${(opcode * 0x100 + operand).toString(16)})`);
            return {};
        } },
};
export const instructionMapping = new Map(Object.entries(instructions).map(([id, data]) => [id, data.code].reverse()));
export const statements = (statements => Object.fromEntries(Object.entries(statements)
    .map(([k, v]) => [k, Object.assign(Object.assign({}, v), { lexemeMatchers: v.lexemes.map(processLexemeMatcherString) })]).map(([k, v]) => [k, Object.assign(Object.assign({}, v), { maxLexemes: v.lexemeMatchers.length, minLexemes: v.lexemeMatchers.filter(m => !m.isOptional).length })])))({
    instruction: {
        lexemes: ["number|label?", "instruction", "number?"],
        getOutput(line) {
            var _a, _b;
            const instruction = line.lexemes[1].text;
            const id = instructionMapping.get(instruction);
            if (id == undefined)
                throw new Error(`Invalid instruction "${instruction}"\nat "${line.rawText}"`);
            return {
                address: ((_a = line.lexemes[0]) === null || _a === void 0 ? void 0 : _a.type) == "number" ? line.lexemes[0].value : undefined,
                value: (+id << 8) + (((_b = line.lexemes[2]) === null || _b === void 0 ? void 0 : _b.type) == "number" ? line.lexemes[2].value : 0)
            };
        }
    },
    memoryValue: {
        lexemes: ["number|label", "number"],
        getOutput(line) {
            var _a;
            return {
                address: ((_a = line.lexemes[0]) === null || _a === void 0 ? void 0 : _a.type) == "number" ? line.lexemes[0].value : 0,
                value: line.lexemes[1].value,
            };
        }
    }
});
