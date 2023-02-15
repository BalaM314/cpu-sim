var _a;
import { instructions } from "./data.js";
import { toHex } from "./funcs.js";
export class RAM {
    constructor(size) {
        this.storage = new Uint16Array(size);
    }
    load(memoryValues) {
        this.clear();
        for (const [index, values] of memoryValues) {
            for (const [i, value] of values.entries()) {
                this.write(index + i, value);
            }
        }
    }
    clear() {
        for (let i = 0; i < this.storage.length; i++) {
            this.storage[i] = 0;
        }
    }
    dump() {
        const output = [];
        let isSkipping = false;
        for (let i = 0; i < this.storage.length; i++) {
            if (this.storage[i] != 0) {
                output.push(`${toHex(i, 2)} ${toHex(this.storage[i], 4)}`);
                isSkipping = false;
            }
            else if (!isSkipping) {
                output.push("...");
                isSkipping = true;
            }
        }
        if (output.length == 1 || output[0] == "...")
            return "[empty]";
        return output.join("\n");
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
export class ProgramExecutor {
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
