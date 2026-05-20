/** Copyright © BalaM314, 2026. MIT License. */
import { processLexemeMatcherString } from "./assembler/lexer.js";
import { crash } from "./funcs.js";
export const lexemeTypes = ["number", "instruction", "label", "register"];
export const registers = ["ACC", "IX", "R1", "R2", "R3", "R4"];
function decodeRegister(number) {
    return registers[number];
}
function encodeRegister(register) {
    const ind = registers.indexOf(register);
    if (ind == -1)
        return null;
    else
        return ind;
}
export const instructions = {
    [0x01]: { code: "END", exec(executor) { executor.on = false; return {}; } },
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
    [0x33]: { code: "LDX", exec(executor, operand) { executor.registers.ACC = executor.mem.read(operand + executor.registers.IX); return {}; } },
    [0x34]: { code: "LDR", exec(executor, operand) { executor.registers.IX = operand; return {}; } },
    [0x40]: { code: "STO", exec(executor, operand) { executor.mem.write(operand, executor.registers.ACC); return {}; } },
    [0x41]: { code: "STD", exec(executor, operand) { executor.mem.write(executor.mem.read(operand), executor.registers.ACC); return {}; } },
    [0x42]: { code: "MOV", exec(executor, operand) {
            const dst = decodeRegister(operand & 0xF0);
            const src = decodeRegister(operand & 0x0F);
            if (dst && src) {
                executor.registers[dst] = executor.registers[src];
            }
            else {
                executor.on = false;
                console.warn(`Invalid MOV instruction at 0x${executor.instructionPointer.toString(16)} (${(0x42 * 0x100 + operand).toString(16)}): invalid register`);
            }
            return {};
        } },
    [0x50]: { code: "ADD", exec(executor, operand) { executor.registers.ACC += executor.mem.read(operand); return {}; } },
    [0x51]: { code: "SUB", exec(executor, operand) { executor.registers.ACC -= executor.mem.read(operand); return {}; } },
    [0x52]: { code: "MUL", exec(executor, operand) { executor.registers.ACC *= executor.mem.read(operand); return {}; } },
    [0x53]: { code: "DIV", exec(executor, operand) { executor.registers.ACC = Math.trunc(executor.registers.ACC / executor.mem.read(operand)); return {}; } },
    [0x54]: { code: "INC", exec(executor, operand) {
            const reg = decodeRegister(operand);
            if (reg)
                executor.registers[reg]++;
            else {
                executor.on = false;
                console.warn(`Invalid INC instruction at 0x${executor.instructionPointer.toString(16)} (${(0x54 * 0x100 + operand).toString(16)}): invalid register`);
            }
            return {};
        } },
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
export const instructionMapping = new Map(Object.entries(instructions).map(([id, data]) => [data.code, id]));
export const statements = (statements => Object.fromEntries(Object.entries(statements)
    .map(([k, v]) => [k, Object.assign(Object.assign({}, v), { lexemeMatchers: v.lexemes.map(processLexemeMatcherString) })]).map(([k, v]) => [k, Object.assign(Object.assign({}, v), { maxLexemes: v.lexemeMatchers.length, minLexemes: v.lexemeMatchers.filter(m => !m.isOptional).length })])))({
    instruction: {
        lexemes: ["number|label?", "instruction", "number?"],
        getOutput(line) {
            var _a, _b;
            const instruction = line.lexemes[1].text;
            const id = instructionMapping.get(instruction.toUpperCase());
            if (id == undefined)
                throw new Error(`Invalid instruction "${instruction}"\nat "${line.rawText}"`);
            return {
                address: ((_a = line.lexemes[0]) === null || _a === void 0 ? void 0 : _a.type) == "number" ? line.lexemes[0].value : undefined, //TODO fix blank addresses
                value: (+id << 8) + (((_b = line.lexemes[2]) === null || _b === void 0 ? void 0 : _b.type) == "number" ? line.lexemes[2].value : 0)
            };
        }
    },
    instruction2: {
        lexemes: ["number|label?", "instruction", "register"],
        getOutput(line) {
            var _a, _b;
            const instruction = line.lexemes[1].text;
            const id = instructionMapping.get(instruction.toUpperCase());
            if (id == undefined)
                throw new Error(`Invalid instruction "${instruction}"\nat "${line.rawText}"`);
            const reg = (_a = encodeRegister(line.lexemes[2].text)) !== null && _a !== void 0 ? _a : crash(`Register ${line.lexemes[2].text} was invalid`);
            return {
                address: ((_b = line.lexemes[0]) === null || _b === void 0 ? void 0 : _b.type) == "number" ? line.lexemes[0].value : undefined,
                value: (+id << 8) + reg,
            };
        }
    },
    instruction3: {
        lexemes: ["number|label?", "instruction", "register", "register"],
        getOutput(line) {
            var _a, _b, _c;
            const instruction = line.lexemes[1].text;
            const id = instructionMapping.get(instruction.toUpperCase());
            if (id == undefined)
                throw new Error(`Invalid instruction "${instruction}"\nat "${line.rawText}"`);
            const reg1 = (_a = encodeRegister(line.lexemes[2].text)) !== null && _a !== void 0 ? _a : crash(`Register ${line.lexemes[2].text} was invalid`);
            const reg2 = (_b = encodeRegister(line.lexemes[3].text)) !== null && _b !== void 0 ? _b : crash(`Register ${line.lexemes[3].text} was invalid`);
            return {
                address: ((_c = line.lexemes[0]) === null || _c === void 0 ? void 0 : _c.type) == "number" ? line.lexemes[0].value : undefined,
                value: (+id << 8) + (reg1 << 4) + (reg2),
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
