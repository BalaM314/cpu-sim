import type { MemoryLoadInstructions } from "./asm.js";


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
	[0x54]: { code: "INC", exec(executor, operand){executor.registers.acc ++; return {};} },
	[0x60]: { code: "CMP", exec(executor, operand){executor.flags.compare = executor.registers.acc == executor.mem.read(operand); return {};} },
	[0xFF]: { code: "", exec(executor, operand, opcode){
		executor.on = false;
		console.warn(`Invalid instruction at 0x${executor.instructionPointer.toString(16)} (${(opcode * 0x100 + operand).toString(16)})`);
		return {};
	}},
};
export const instructionMapping = new Map(Object.entries(instructions).map(([id, data]) => [id, data.code].reverse() as [code:string, id:string]));
function toHex(n:number, length:number = 4){
	return ("0000" + n.toString(16).toUpperCase()).slice(-length);
}
export class RAM {
	private storage:Uint16Array;
	static readonly bits = 16;
	static readonly maxValue = 2 ** this.bits;
	constructor(size:number){
		this.storage = new Uint16Array(size);
	}
	load(memoryValues:MemoryLoadInstructions){
		for(const [index, values] of memoryValues){
			for(const [i, value] of values.entries()){
				this.write(index + i, value);
			}
		}
	}
	dump(){
		const output:string[] = [];
		let isSkipping = false;
		for(let i = 0; i < this.storage.length; i ++){
			if(this.storage[i] != 0){
				output.push(`${toHex(i, 2)} ${toHex(this.storage[i], 4)}`);
				isSkipping = false;
			} else if(!isSkipping){
				output.push("...");
				isSkipping = true;
			}
		}
		return output.join("\n");
	}
	read(index:number){
		if(index in this.storage) return this.storage[index];
		else throw new Error(`Index ${index} is out of bounds`);
	}
	write(index:number, value:number){
		if(!Number.isInteger(value)) throw new Error(`Value ${value} is not an integer`);
		if(value < 0 || value > RAM.maxValue) throw new Error(`Value ${value} is not a valid 16-bit integer`);
		if(index in this.storage) this.storage[index] = value;
		else throw new Error(`Index ${index} is out of bounds`);
	}
}

export class ProgramExecutor {
	on = true;
	flags = {
		compare: false
	}
	registers = {
		acc: 0
	};
	constructor(public mem:RAM, public instructionPointer = 0){}
	tick(){
		if(!this.on) return;

		//fetch
		const instructionData = this.mem.read(this.instructionPointer);
		
		//decode
		const opcode = instructionData >> 8;
		const operand = instructionData & 0x00FF;
		const instruction = instructions[opcode] ?? instructions[0xFF];

		//execute
		const { instructionPointerModified } = instruction.exec(this, operand, opcode);
		
		if(!instructionPointerModified) this.instructionPointer ++;

	}
	state(){
		//NYI
	}
}
