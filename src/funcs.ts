
export function toHex(n:number, length:number = 4){
	return ("0000" + n.toString(16).toUpperCase()).slice(-length);
}