/** Copyright © BalaM314, 2026. MIT License. */

export function toHex(n:number, length:number = 4){
	return ("0000" + n.toString(16).toUpperCase()).slice(-length);
}

export function getElement<T extends typeof HTMLElement>(id:string, type:T, mode:"id" | "class" = "id"){
	const element:unknown = mode == "class" ? document.getElementsByClassName(id)[0] : document.getElementById(id);
	if(element instanceof type) return element as T["prototype"];
	else if(element instanceof HTMLElement) crash(`Element with id ${id} was fetched as type ${type.name}, but was of type ${element.constructor.name}`);
	else crash(`Element with id ${id} does not exist`);
}

/**
 * Called when an invariant is violated, or when there is a mistake in the code.
 */
export function crash(message:string, ...extra:unknown[]):never {
	if(extra.length > 0 && typeof console != "undefined") console.error(...extra);
	throw new Error(message);
}

