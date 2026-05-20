/** Copyright © BalaM314, 2024. MIT License. */
export function toHex(n, length = 4) {
    return ("0000" + n.toString(16).toUpperCase()).slice(-length);
}
export function getElement(id, type, mode = "id") {
    const element = mode == "class" ? document.getElementsByClassName(id)[0] : document.getElementById(id);
    if (element instanceof type)
        return element;
    else if (element instanceof HTMLElement)
        crash(`Element with id ${id} was fetched as type ${type.name}, but was of type ${element.constructor.name}`);
    else
        crash(`Element with id ${id} does not exist`);
}
/**
 * Called when an invariant is violated, or when there is a mistake in the code.
 */
export function crash(message, ...extra) {
    if (extra.length > 0 && typeof console != "undefined")
        console.error(...extra);
    throw new Error(message);
}
