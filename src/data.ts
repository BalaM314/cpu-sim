import type { ProgramExecutor } from "./cpu.js";
import type { ProcessedLine, MemoryValue } from "./assembler/types.js";
import { processLexemeMatcherString } from "./assembler/lexer.js";

export const lexemeTypes = ["number", "instruction", "label"] as const;

interface InstructionData {
	code: string;
	exec: (executor:ProgramExecutor, operand:number, opcode:number) => {instructionPointerModified?:boolean;};
}

export const instructions: {
	[index: number]: InstructionData;
} = {
	[0x00]: { code: "END", exec(executor){executor.on = false; return {};} },
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
	[0x30]: { code: "LDM", exec(executor, operand){executor.registers.acc = operand; return {};} },
	[0x31]: { code: "LDD", exec(executor, operand){executor.registers.acc = executor.mem.read(operand); return {};} },
	[0x32]: { code: "LDI", exec(executor, operand){executor.registers.acc = executor.mem.read(executor.mem.read(operand)); return {};} },
	[0x40]: { code: "STO", exec(executor, operand){executor.mem.write(operand, executor.registers.acc); return {};} },
	[0x50]: { code: "ADD", exec(executor, operand){executor.registers.acc += executor.mem.read(operand); return {};} },
	[0x51]: { code: "SUB", exec(executor, operand){executor.registers.acc -= executor.mem.read(operand); return {};} },
	[0x52]: { code: "MUL", exec(executor, operand){executor.registers.acc *= executor.mem.read(operand); return {};} },
	[0x53]: { code: "DIV", exec(executor, operand){executor.registers.acc = Math.trunc(executor.registers.acc / executor.mem.read(operand)); return {};} },
	[0x54]: { code: "INC", exec(executor, operand){executor.registers.acc ++; return {};} },
	[0x55]: { code: "AND", exec(executor, operand){executor.registers.acc &= executor.mem.read(operand); return {};} },
	[0x56]: { code: "ORD", exec(executor, operand){executor.registers.acc |= executor.mem.read(operand); return {};} },
	[0x57]: { code: "XOR", exec(executor, operand){executor.registers.acc ^= executor.mem.read(operand); return {};} },
	[0x60]: { code: "CMP", exec(executor, operand){executor.flags.compare = executor.registers.acc == executor.mem.read(operand); return {};} },
	[0x61]: { code: "SLT", exec(executor, operand){executor.flags.compare = executor.registers.acc < executor.mem.read(operand); return {};} },
	[0x62]: { code: "SGT", exec(executor, operand){executor.flags.compare = executor.registers.acc > executor.mem.read(operand); return {};} },
	[0xFF]: { code: "", exec(executor, operand, opcode){
		executor.on = false;
		console.warn(`Invalid instruction at 0x${executor.instructionPointer.toString(16)} (${(opcode * 0x100 + operand).toString(16)})`);
		return {};
	}},
};
export const instructionMapping = new Map(Object.entries(instructions).map(([id, data]) => [id, data.code].reverse() as [code:string, id:string]));

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
			const instruction = line.lexemes[1]!.value;
			const id = instructionMapping.get(instruction);
			if(id == undefined) throw new Error(`Invalid instruction "${instruction}"\nat "${line.rawText}"`);
			return {
				address: line.lexemes[0]?.type == "number" ? + line.lexemes[0].value : undefined,
				value: (+id << 8) + +(line.lexemes[2]?.value ?? 0)
			}
		}
	},
	memoryValue: {
		lexemes: ["number|label?", "number"],
		getOutput(line:ProcessedLine):MemoryValue {
			return {
				address: line.lexemes[0]?.type == "number" ? + line.lexemes[0].value : undefined,
				value: +(line.lexemes[1]!.value)
			}
		}
	}
});