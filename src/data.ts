/** Copyright © BalaM314, 2026. MIT License. */

import type { ProgramExecutor } from "./cpu.js";
import type { ProcessedLine, MemoryValue } from "./assembler/types.js";
import { processLexemeMatcherString } from "./assembler/lexer.js";
import { crash } from "./funcs.js";

export const lexemeTypes = ["number", "instruction", "label", "register"] as const;

interface InstructionData {
	code: string;
	exec: (executor:ProgramExecutor, operand:number, opcode:number) => {instructionPointerModified?:boolean;};
}

export const registers = ["ACC", "IX", "R1", "R2", "R3", "R4"] as const;
export type Register = (typeof registers)[number];

function decodeRegister(number:number):Register | undefined {
	return registers[number];
}
function encodeRegister(register:Register):number;
function encodeRegister(register:string):number | null;
function encodeRegister(register:string):number | null {
	const ind = (registers as readonly string[]).indexOf(register);
	if(ind == -1) return null; else return ind;
}

export const instructions: {
	[index: number]: InstructionData;
} = {
	[0x01]: { code: "END", exec(executor){executor.on = false; return {};} },
	[0x10]: { code: "NOP", exec(){return {};} },
	[0x20]: { code: "JPA", exec(executor, operand){executor.instructionPointer = operand; return { instructionPointerModified: true };} },
	[0x21]: { code: "JPE", exec(executor, operand){
		if(executor.flags.compare){
			executor.instructionPointer = operand;
			return { instructionPointerModified: true };
		} else return {};
	} },
	[0x22]: { code: "JPN", exec(executor, operand){
		if(!executor.flags.compare){
			executor.instructionPointer = operand;
			return { instructionPointerModified: true };
		} else return {};
	} },
	[0x30]: { code: "LDM", exec(executor, operand){executor.registers.ACC = operand; return {};} },
	[0x31]: { code: "LDD", exec(executor, operand){executor.registers.ACC = executor.mem.read(operand); return {};} },
	[0x32]: { code: "LDI", exec(executor, operand){executor.registers.ACC = executor.mem.read(executor.mem.read(operand)); return {};} },
	[0x33]: { code: "LDX", exec(executor, operand){executor.registers.ACC = executor.mem.read(operand + executor.registers.IX); return {};} },
	[0x34]: { code: "LDR", exec(executor, operand){executor.registers.IX = operand; return {};} },
	[0x40]: { code: "STO", exec(executor, operand){executor.mem.write(operand, executor.registers.ACC); return {};} },
	[0x41]: { code: "STD", exec(executor, operand){executor.mem.write(executor.mem.read(operand), executor.registers.ACC); return {};} },
	[0x42]: { code: "MOV", exec(executor, operand){
		const dst = decodeRegister(operand >> 4);
		const src = decodeRegister(operand & 0x0F);
		if(dst && src){
			executor.registers[dst] = executor.registers[src];
		} else {
			executor.on = false;
			console.warn(`Invalid MOV instruction at 0x${executor.instructionPointer.toString(16)} (${(0x42 * 0x100 + operand).toString(16)}): invalid register`);
		}
		return {};
	} },
	[0x50]: { code: "ADD", exec(executor, operand){executor.registers.ACC += executor.mem.read(operand); return {};} },
	[0x51]: { code: "SUB", exec(executor, operand){executor.registers.ACC -= executor.mem.read(operand); return {};} },
	[0x52]: { code: "MUL", exec(executor, operand){executor.registers.ACC *= executor.mem.read(operand); return {};} },
	[0x53]: { code: "DIV", exec(executor, operand){executor.registers.ACC = Math.trunc(executor.registers.ACC / executor.mem.read(operand)); return {};} },
	[0x54]: { code: "INC", exec(executor, operand){
		const reg = decodeRegister(operand);
		if(reg) executor.registers[reg] ++;
		else {
			executor.on = false;
			console.warn(`Invalid INC instruction at 0x${executor.instructionPointer.toString(16)} (${(0x54 * 0x100 + operand).toString(16)}): invalid register`);
		}
		return {};
	} },
	[0x55]: { code: "AND", exec(executor, operand){executor.registers.ACC &= executor.mem.read(operand); return {};} },
	[0x56]: { code: "ORD", exec(executor, operand){executor.registers.ACC |= executor.mem.read(operand); return {};} },
	[0x57]: { code: "XOR", exec(executor, operand){executor.registers.ACC ^= executor.mem.read(operand); return {};} },
	[0x60]: { code: "CMP", exec(executor, operand){executor.flags.compare = executor.registers.ACC == executor.mem.read(operand); return {};} },
	[0x61]: { code: "SLT", exec(executor, operand){executor.flags.compare = executor.registers.ACC < executor.mem.read(operand); return {};} },
	[0x62]: { code: "SGT", exec(executor, operand){executor.flags.compare = executor.registers.ACC > executor.mem.read(operand); return {};} },
	[0xFF]: { code: "", exec(executor, operand, opcode){
		executor.on = false;
		console.warn(`Invalid instruction at 0x${executor.instructionPointer.toString(16)} (${(opcode * 0x100 + operand).toString(16)})`);
		return {};
	}},
};
export const instructionMapping = new Map<string, string>(Object.entries(instructions).map(([id, data]) => [data.code, id]));

export const statements = (statements => Object.fromEntries(
	Object.entries(statements)
	.map(([k, v]) => [k, {
		...v,
		lexemeMatchers: v.lexemes.map(processLexemeMatcherString)
	}] as const).map(([k, v]) => [k, {
		...v,
		maxLexemes: v.lexemeMatchers.length,
		minLexemes: v.lexemeMatchers.filter(m => !m.isOptional).length
	}])
))({
	instruction: {
		lexemes: ["number|label?", "instruction", "number?"],
		getOutput(line:ProcessedLine):MemoryValue {
			const instruction = line.lexemes[1]!.text;
			const id = instructionMapping.get(instruction.toUpperCase());
			if(id == undefined) throw new Error(`Invalid instruction "${instruction}"\nat "${line.rawText}"`);
			return {
				address: line.lexemes[0]?.type == "number" ? line.lexemes[0].value : undefined, //TODO fix blank addresses
				value: (+id << 8) + (line.lexemes[2]?.type == "number" ? line.lexemes[2].value! : 0)
			}
		}
	},
	instruction2: { //one register as operand
		lexemes: ["number|label?", "instruction", "register"],
		getOutput(line:ProcessedLine):MemoryValue {
			const instruction = line.lexemes[1]!.text;
			const id = instructionMapping.get(instruction.toUpperCase());
			if(id == undefined) throw new Error(`Invalid instruction "${instruction}"\nat "${line.rawText}"`);
			const reg = encodeRegister(line.lexemes[2]!.text) ?? crash(`Register ${line.lexemes[2]!.text} was invalid`);
			return {
				address: line.lexemes[0]?.type == "number" ? line.lexemes[0].value : undefined,
				value: (+id << 8) + reg,
			}
		}
	},
	instruction3: { //for the MOV instruction: two registers
		lexemes: ["number|label?", "instruction", "register", "register"],
		getOutput(line:ProcessedLine):MemoryValue {
			const instruction = line.lexemes[1]!.text;
			const id = instructionMapping.get(instruction.toUpperCase());
			if(id == undefined) throw new Error(`Invalid instruction "${instruction}"\nat "${line.rawText}"`);
			const reg1 = encodeRegister(line.lexemes[2]!.text) ?? crash(`Register ${line.lexemes[2]!.text} was invalid`);
			const reg2 = encodeRegister(line.lexemes[3]!.text) ?? crash(`Register ${line.lexemes[3]!.text} was invalid`);
			return {
				address: line.lexemes[0]?.type == "number" ? line.lexemes[0].value : undefined,
				value: (+id << 8) + (reg1 << 4) + (reg2),
			}
		}
	},
	memoryValue: {
		lexemes: ["number|label", "number"],
		getOutput(line:ProcessedLine):MemoryValue {
			return {
				address: line.lexemes[0]?.type == "number" ? line.lexemes[0].value : 0,
				value: line.lexemes[1]!.value!,
			}
		}
	}
});