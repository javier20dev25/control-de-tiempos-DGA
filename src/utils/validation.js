/**
 * ISO 6346 Container Number Validation
 * Structure: AAAA 123456 7
 */

export const validateContainer = (containerId) => {
    // Only enforce format: 4 uppercase letters + 7 digits
    const regex = /^[A-Z]{4}[0-9]{7}$/;
    return regex.test(containerId);
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
