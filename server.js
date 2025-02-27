const crc = require('crc');
const qrcode = require('qrcode');
const { Buffer } = require('buffer');
const express = require('express');
const cors = require('cors');
const path = require('path'); // Import the path module

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Example POST endpoint for generating QR codes (commented out for now)
app.post('/generate-qr', async (req, res) => {
    const { account, oneTime, country, money, currency } = req.body;

    try {
        const qrCode = await createQrPromptPay(account, oneTime, country, money, currency);
        res.json({ qrCode });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

/**
 * Generate a PromptPay QR code.
 * @param {string} account - The account number (phone, national ID, or reference number).
 * @param {boolean} [oneTime=true] - Whether the QR code is for one-time use.
 * @param {string} [country="TH"] - The country code.
 * @param {string} [money=""] - The amount of money.
 * @param {string} [currency="THB"] - The currency code.
 * @returns {Promise<string>} - A base64-encoded PNG image of the QR code.
 */
async function createQrPromptPay(account, oneTime = true, country = "TH", money = "", currency = "THB") {
    // Constants
    const VERSION = "000201";
    const ONE_TIME_CODE = oneTime ? "010212" : "010211";
    const PROMPTPAY_APP_ID = "0016A000000677010111";
    const COUNTRY_CODE = `5802${country}`;
    const CURRENCY_CODE = currency === "THB" ? "5303764" : "";

    // Determine merchant account information based on account type
    let merchantAccountInfo;
    if (account.length === 10 || account.length === 13) {
        merchantAccountInfo = "2937"; // Merchant information for phone or national ID
    } else {
        merchantAccountInfo = "2939"; // Merchant information for reference number
    }

    merchantAccountInfo += PROMPTPAY_APP_ID;

    if (account.length === 10) { // Phone number
        merchantAccountInfo += `01130066${account.slice(1)}`; 
    } else if (account.length === 13) { // National ID
        merchantAccountInfo += `0213${account.replace(/-/g, '')}`;
    } else { // Reference number
        merchantAccountInfo += `0315${account}5303764`;
    }

    // Handle money formatting
    let moneyStr = "";
    if (money) {
        const formattedMoney = formatMoney(money);
        moneyStr = `54${String(formattedMoney.length).padStart(2, '0')}${formattedMoney}`;
    }
    //formatMoney_Function
    function formatMoney(money) {
        const moneyParts = money.split('.');
        if (moneyParts.length === 1 || moneyParts[1].length === 1) {
           
            return parseFloat(money).toFixed(2);
        }
        return money; 
    }

    // Generate Old checksum version
    // const payload = VERSION + ONE_TIME_CODE + merchantAccountInfo + COUNTRY_CODE + CURRENCY_CODE + moneyStr + "6304";
    // const checksum = crc.crc16xmodem(Buffer.from(payload)).toString(16).padStart(4, '0');
    // const fullPayload = payload + checksum;

    const payload = VERSION + ONE_TIME_CODE + merchantAccountInfo + COUNTRY_CODE + CURRENCY_CODE + moneyStr + "6304";
    const checksum = calculateChecksum(payload);
    const fullPayload = payload + checksum;

    // Generate QR code as a base64-encoded image
    const qrCodeBase64 = await generateQRCode(fullPayload);
    return qrCodeBase64;

   
    //return Checksum
    function calculateChecksum(payload) {
        // Use CRC-16/CCITT-FALSE algorithm
        const checksum = crc.crc16ccitt(payload).toString(16).toUpperCase().padStart(4, '0');
        return checksum;
    }

    // Generate QR code as a base64-encoded PNG
    async function generateQRCode(payload) {
        try {
            const qrCodeBase64 = await qrcode.toDataURL(payload);
            return qrCodeBase64;
        } catch (error) {
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }

}

// Example usage
 (async () => {
     const qrCode = await createQrPromptPay("012345678", true, "TH", "50.00", "THB");
     console.log(qrCode); // Outputs the base64-encoded QR code image
 })();