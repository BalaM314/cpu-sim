# cpu-sim

A CPU simulator and assembler, modeling the von Neumann architecture. [Click here](https://balam314.github.io/cpu-sim/) to use the website.

## Quick start

Enter assembly code on the left. Click "Assemble" to load it into memory. Then, click "tick" to run one instruction.

Click "reset" to reset the CPU. This does not revert changes made to memory. Click "Assemble" again to reset the memory.

## General information

The CPU is 16-bit. Registers and memory addresses are 16 bits wide.

Instructions are fixed-length, always 16 bits wide. The first byte is the instruction code and the second byte is the operand. Operands are 8 bits.

## Components

### Assembler

The assembler reads entered assembly code and outputs machine code. This code is then loaded into memory.

### CPU

The CPU executes machine code, one instruction at a time. It fetches the instruction from memory, decodes it, and then executes it. Finally, the instruction pointer is incremented by one (unless the instruction was a jump) to prepare for the next instruction.

## Instructions

|Opcode|Instruction|Description|
|---|---|----|
|0x01|END|Halts execution.|
|0x10|NOP|Does nothing.|
|0x20|JPA|Jumps to the provided address.|
|0x21|JPE|Jumps to the provided address if the previous comparison was true.|
|0x22|JPN|Jumps to the provided address if the previous comparison was false.|
|0x30|LDM|Loads the provided value into the accumulator.|
|0x31|LDD|Loads the value at the provided address into the accumulator.|
|0x32|LDI|Loads the value at the address at the provided address into the accumulator. (\*\*operand in C-style syntax)|
|0x33|LDX|Loads the value at (the provided address plus the index register) into the accumulator.|
|0x34|LDR|Loads the provided value into the index register.|
|0x40|STO|Stores the contents of the accumulator into the provided address.|
|0x41|STD|Stores the contents of the accumulator into the address at the provided address.|
|0x42|MOV|Sets the value of the first provided register to the value of the second provided register.|
|0x50|ADD|Adds the value at the provided address to the accumulator.|
|0x51|SUB|Subtracts the value at the provided address from the accumulator.|
|0x52|MUL|Multiplies the contents accumulator by the value at the provided address.|
|0x53|DIV|Divides the contents of the accumulator by the value at the provided address.|
|0x54|INC|Increments the provided register.|
|0x55|AND|Performs bitwise and with the accumulator and the value at the provided address, storing the result in the accumulator.|
|0x56|ORD|Performs bitwise or with the accumulator and the value at the provided address, storing the result in the accumulator.|
|0x57|XOR|Performs bitwise xor with the accumulator and the value at the provided address, storing the result in the accumulator.|
|0x60|CMP|Checks if the accumulator equals the value at the provided address.|
|0x61|SLT|Checks if the accumulator is less than the value at the provided address.|
|0x62|SGT|Checks if the accumulator is greater than the value at the provided address.|

## Sample programs
[programs/](programs/)

