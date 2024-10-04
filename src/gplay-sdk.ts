import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Path to your service account key file
const keyFile: string = path.join(__dirname, 'service-account-file.json');

// Your app's package name
const packageName: string = 'com.mangala.prowallet';

// Example productId and purchaseToken that you received from the purchase
const productId: string = 'premium_eos_account';
const purchaseToken: string = 'habeidhdnnlfpofjbhomapeb.AO-J1OyTwWFoRRGvBHTmaxdOsN9-DCw0Mp8ywXu9O7GuKxaw2dlc3n86cbWjkVZ9MK1wcIJXQURNbN7CslNwBY2gkHIHZSD8o4T5tKcpvUT31WJG1aPdrxs';

async function consumePurchase(): Promise<void> {
    try {
        const androidPublisher = google.androidpublisher("v3");
        // Initialize the GoogleAuth client with the service account credentials
        const authClient = new google.auth.GoogleAuth({
            credentials: JSON.parse(fs.readFileSync(keyFile).toString()),
            scopes: ["https://www.googleapis.com/auth/androidpublisher"],
        });

        const purchase = await androidPublisher.purchases.products.consume({
            auth: authClient,
            packageName: packageName,
            productId: productId,
            token: purchaseToken,
        });

        // Handle the response from the Google Play API
        console.log('Purchase consumed successfully:', purchase);
    } catch (error) {
        console.error('Failed to consume purchase:', error);
    }
}

// Call the function to consume the purchase
consumePurchase();