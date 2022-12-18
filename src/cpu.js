"use strict";
var _a;
const instructions = {
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
class RAM {
    constructor(size) {
        this.storage = new Uint16Array(size);
    }
    load(memoryValues) {
        for (const [index, values] of memoryValues) {
            for (const [i, value] of values.entries()) {
                this.write(index + i, value);
            }
        }
    }
    dump() {
        //NYI
    }
    read(index) {
        if (index in this.storage)
            return this.storage[index];
        else
            throw new Error(`Index ${index} is out of bounds`);
    }
    write(index, value) {
        if (!Number.isInteger(value))
            throw new Error(`Value ${value} is not an integer`);
        if (value < 0 || value > RAM.maxValue)
            throw new Error(`Value ${value} is not a valid 16-bit integer`);
        if (index in this.storage)
            this.storage[index] = value;
        else
            throw new Error(`Index ${index} is out of bounds`);
    }
}
_a = RAM;
RAM.bits = 16;
RAM.maxValue = 2 ** _a.bits;
class ProgramExecutor {
    constructor(mem, instructionPointer = 0) {
        this.mem = mem;
        this.instructionPointer = instructionPointer;
        this.on = true;
        this.flags = {
            compare: false
        };
        this.registers = {
            acc: 0
        };
    }
    tick() {
        var _b;
        if (!this.on)
            return;
        //fetch
        const instructionData = this.mem.read(this.instructionPointer);
        //decode
        const opcode = instructionData >> 8;
        const operand = instructionData & 0x00FF;
        const instruction = (_b = instructions[opcode]) !== null && _b !== void 0 ? _b : instructions[0xFF];
        //execute
        const { instructionPointerModified } = instruction.exec(this, operand, opcode);
        if (!instructionPointerModified)
            this.instructionPointer++;
    }
    state() {
        //NYI
    }
}
