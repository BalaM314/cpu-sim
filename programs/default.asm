start: LDD 80 //Load the value at address 80 into the accumulator
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
82 60
