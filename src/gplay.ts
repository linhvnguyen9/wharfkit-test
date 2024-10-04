import axios, { AxiosResponse } from 'axios';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';

// Define types for the responses and errors (optional but recommended)
interface ConsumePurchaseResponse {
  // Define according to the response structure you expect from the API
  kind: string;
  purchaseTimeMillis: string;
}

interface ApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

// Path to your service account key file
const keyFile: string = path.join(__dirname, 'service-account-file.json');

// Your app's package name
const packageName: string = 'com.mangala.prowallet';

// Example productId and purchaseToken that you received from the purchase
const productId: string = 'premium_eos_account';
const purchaseToken: string = 'mndfonfplkjdfbohplhgdehj.AO-J1OzklN3DFqU6g0zGT1n9tl4zmsh2hZvEg9GNS6dsAsZg7ODII6bPIb9k2jSTZCY3ePuJPB_qb2sWhwMMdQ6Mo1zns9tae4__61oqhBw4a1IwEDlfMPw';

async function consumePurchase(): Promise<void> {
  try {
    // Initialize the GoogleAuth client to authenticate using your service account
    const auth = new GoogleAuth({
      keyFile: keyFile,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    // Acquire the access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Verify that we have an access token
    if (!accessToken.token) {
      throw new Error('Failed to retrieve access token');
    }

    // Google Play Developer API endpoint for consuming a purchase
    const url: string = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}:consume`;

    // Make the HTTP POST request to consume the purchase
    const response: AxiosResponse<ConsumePurchaseResponse> = await axios.post(url, {
      token: purchaseToken,
    }, {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
        },
      });

    console.log('Purchase consumed successfully:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Error with the API request
      const apiError: ApiError = error.response.data;
      console.error('API Error:', apiError.error.message);
    } else {
      // General error
      console.error('Failed to consume purchase:', error);
    }
  }
}

// Call the function
consumePurchase();