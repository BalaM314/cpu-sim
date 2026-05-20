00 LDM 0
01 MOV R4 ACC
//set R4 to zero

//loop
02 LDD 82
03 AND 09
04 STO 09 //clear the second half of the byte with &= 0xF0
05 MOV ACC R4
06 MUL 83
07 ORD 09
08 STO 09 //set it to R4 with |= R4
09 JPA 50

//jump table starts at 50
50 LDM 12
   JPA 60
   LDM 50
   JPA 60
   LDM 13
   JPA 60
   LDM 24
   JPA 60

60 INC R4
   MOV ACC R4
   SLT 81
   JPE 02
   END

81 04 //max loop iterations
82 FFF0
83 2 //length of each entry in the jump table (2 addresses)
