/**
 * ISO 6346 Container Number Validation
 * Structure: AAAA 123456 7
 */

export const validateContainer = (containerId) => {
    const regex = /^[A-Z]{4}[0-9]{7}$/;
    if (!regex.test(containerId)) return false;

    const charCode = (char) => {
        const code = char.charCodeAt(0);
        if (code >= 48 && code <= 57) return code - 48; // 0-9
        // A=10, B=12, ..., K=21, L=23, ..., U=32, V=34, ..., Z=38
        // (Skips multiples of 11)
        let val = code - 55;
        if (val > 10) val++;
        if (val > 21) val++;
        if (val > 32) val++;
        return val;
    };

    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += charCode(containerId[i]) * Math.pow(2, i);
    }

    const checkDigit = (sum % 11) % 10;
    return checkDigit === parseInt(containerId[10]);
};

export const sanitizeContainer = (text) => {
    let cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    
    // First 4 characters must be letters (Owner Code + Category Identifier)
    let lettersPart = cleanText.substring(0, 4)
        .replace(/0/g, "O")
        .replace(/1/g, "I")
        .replace(/5/g, "S")
        .replace(/8/g, "B")
        .replace(/2/g, "Z")
        .replace(/[^A-Z]/g, ""); // Ensure strictly letters

    // Remaining characters must be digits (Serial Number + Check Digit)
    let numbersPart = cleanText.substring(4)
        .replace(/O/g, "0")
        .replace(/I/g, "1")
        .replace(/S/g, "5")
        .replace(/B/g, "8")
        .replace(/Z/g, "2")
        .replace(/[^0-9]/g, ""); // Ensure strictly digits

    return lettersPart + numbersPart;
};
