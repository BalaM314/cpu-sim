import * as cpu_js from "./cpu.js";
import * as asm_js from "./assembler/assembler.js";
import * as lexer_js from "./assembler/lexer.js";
import * as funcs_js from "./funcs.js";

Object.assign(window, cpu_js);
Object.assign(window, asm_js);
Object.assign(window, funcs_js);
Object.assign(window, lexer_js);

const { RAM, ProgramExecutor } = cpu_js;
const { getElement, toHex } = funcs_js;
const { assembleProgram } = asm_js;

const mem = new RAM(1024);
const cpu = new ProgramExecutor(mem);
Object.assign(window, {mem, cpu});
const sampleProgram = `start: LDD 80 //Load the value at address 80 into the accumulator
ADD 81 //Add the value at address 81
STO 80 //Store the result to address 80
JPA 10 //Jump to address 10

10 LDD 80
11 SGT 82 //Check if ACC is greater than the value in address 82
12 JPN 0 //If not, jump to address 0
13 END

//Store these numbers in these addresses
80 15
81 15
82 60`;
const assembly = getElement("assembly", HTMLTextAreaElement);
const memory = getElement("memory", HTMLTextAreaElement);
const assemble = getElement("assemble", HTMLButtonElement);
const tick = getElement("tick", HTMLButtonElement);
const reset = getElement("reset", HTMLButtonElement);
const clear = getElement("clear", HTMLButtonElement);
const error = getElement("error", HTMLDivElement);
const cpuStatus = getElement("cpu-status", HTMLDivElement);
if(!assembly.value){
  assembly.value = sampleProgram;
}
memory.value = mem.dump();
assemble.onclick = e => {
  clear.removeAttribute("disabled");
  try {
    mem.load(assembleProgram(assembly.value.split("\n")));
    error.innerText = "";
    cpuStatus.innerText = `Program loaded. Press 'Tick' to run the program one step.`;
  } catch(err){
    cpuStatus.innerText = ``;
    error.innerText = (err as Error).message ?? err;
  }
  memory.value = mem.dump();
}
tick.onclick = e => {
  cpu.tick();
  memory.value = mem.dump();
  cpuStatus.innerText = `instruction pointer: ${toHex(cpu.instructionPointer - 1)}, accumulator contents: ${toHex(cpu.registers.ACC)}`;
  if(!cpu.on) cpuStatus.innerText += " CPU off";
  if(!cpu.on) tick.setAttribute("disabled", "true");
  reset.removeAttribute("disabled");
}
reset.onclick = e => {
  cpu.reset();
  reset.setAttribute("disabled", "true");
  tick.removeAttribute("disabled");
  cpuStatus.innerText = `CPU reset. ${mem.cleared ? "Memory not cleared." : ""}`;
}
clear.onclick = e => {
  mem.clear();
  clear.setAttribute("disabled", "true");
  cpu.instructionPointer = 0;
  memory.value = mem.dump();
  cpuStatus.innerText = `Memory cleared.`;
}
