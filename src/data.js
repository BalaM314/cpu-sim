export const lexemeTypes = ["number", "instruction", "label"];
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
    [0x30]: { code: "LDM", exec(executor, operand) { executor.registers.acc = operand; return {}; } },
    [0x31]: { code: "LDD", exec(executor, operand) { executor.registers.acc = executor.mem.read(operand); return {}; } },
    [0x32]: { code: "LDI", exec(executor, operand) { executor.registers.acc = executor.mem.read(executor.mem.read(operand)); return {}; } },
    [0x40]: { code: "STO", exec(executor, operand) { executor.mem.write(operand, executor.registers.acc); return {}; } },
    [0x50]: { code: "ADD", exec(executor, operand) { executor.registers.acc += executor.mem.read(operand); return {}; } },
    [0x54]: { code: "INC", exec(executor, operand) { executor.registers.acc++; return {}; } },
    [0x60]: { code: "CMP", exec(executor, operand) { executor.flags.compare = executor.registers.acc == executor.mem.read(operand); return {}; } },
    [0xFF]: { code: "", exec(executor, operand, opcode) {
            executor.on = false;
            console.warn(`Invalid instruction at 0x${executor.instructionPointer.toString(16)} (${(opcode * 0x100 + operand).toString(16)})`);
            return {};
        } },
};
export const instructionMapping = new Map(Object.entries(instructions).map(([id, data]) => [id, data.code].reverse()));
function processLexemeMatcherString(str) {
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
export const statements = (statements => Object.fromEntries(Object.entries(statements)
    .map(([k, v]) => [k, Object.assign(Object.assign({}, v), { lexemeMatchers: v.lexemes.map(processLexemeMatcherString) })]).map(([k, v]) => [k, Object.assign(Object.assign({}, v), { maxLexemes: v.lexemeMatchers.length, minLexemes: v.lexemeMatchers.filter(m => !m.isOptional).length })])))({
    instruction: {
        lexemes: ["number|label?", "instruction", "number?"],
        getOutput(line) {
            var _a, _b, _c;
            const instruction = line.lexemes[1].value;
            const id = instructionMapping.get(instruction);
            if (id == undefined)
                throw new Error(`Invalid instruction ${instruction}`);
            return {
                address: ((_a = line.lexemes[0]) === null || _a === void 0 ? void 0 : _a.type) == "number" ? +line.lexemes[0].value : undefined,
                value: (+id << 8) + +((_c = (_b = line.lexemes[2]) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 0)
            };
        }
    },
    memoryValue: {
        lexemes: ["number|label?", "number"],
        getOutput(line) {
            var _a;
            return {
                address: ((_a = line.lexemes[0]) === null || _a === void 0 ? void 0 : _a.type) == "number" ? +line.lexemes[0].value : undefined,
                value: +(line.lexemes[1].value)
            };
        }
    }
});
