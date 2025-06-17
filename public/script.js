document.getElementById('qrForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get form data
    const account = document.getElementById('account').value;
    const amount = document.getElementById('amount').value;
    const oneTime = document.getElementById('oneTime').checked;
    const currency = document.getElementById('currency').value;

console.log(account, amount, oneTime, currency);

    // Call the backend to generate the QR code
    try {
        const response = await fetch('/generate-qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account,
                oneTime,
                country: "TH", // Default to Thailand
                money: amount,
                currency,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate QR code');
        }

        const data = await response.json();
        const qrCodeImage = document.getElementById('qrCodeImage');
        qrCodeImage.src = data.qrCode;
        document.getElementById('qrCodeContainer').classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate QR code. Please try again.');
    }
});


