/** Copyright © BalaM314, 2024. MIT License. */
export function toHex(n, length = 4) {
    return ("0000" + n.toString(16).toUpperCase()).slice(-length);
}
