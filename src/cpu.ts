import type { MemoryLoadInstructions } from "./assembler/types.js";
import { instructions } from "./data.js";
import { toHex } from "./funcs.js";




export class RAM {
	private storage:Uint16Array;
	static readonly bits = 16;
	static readonly maxValue = 2 ** this.bits;
	constructor(size:number){
		this.storage = new Uint16Array(size);
	}
	load(memoryValues:MemoryLoadInstructions){
		this.clear();
		for(const [index, values] of memoryValues){
			for(const [i, value] of values.entries()){
				this.write(index + i, value);
			}
		}
	}
	clear(){
		for(let i = 0; i < this.storage.length; i ++){
			this.storage[i] = 0;
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
		if(output.length == 1 || output[0] == "...") return "[empty]";
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
