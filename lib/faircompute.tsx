export async function apiRequest<T>(endpoint: string, method: string, api:boolean, token:boolean,  version: boolean, requestData?: any): Promise<T> {
    const apiUrl = getFairApiUrl();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "X-API-Key": getFairProviderPubApiKey(),
    };
    if (token){
        headers["Authorization"] = "Bearer " + localStorage.getItem("token");
    }

    if(api){
        headers["X-API-Key"] = getFairProviderPubApiKey();
    }

    const body: any = { data: requestData || {} };
    
    if (version) {
        body.version = FAIR_API_VERSION;
      }

    const response = await fetch(`${apiUrl}${endpoint}`, {
        method,
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
    let errorMessage = `Failed to fetch data. Status code: ${response.status}`;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage += `, Error message: ${errorData.message}`;
        }
      } else {
        const errorText = await response.text();
        errorMessage += `, Error message: ${errorText}`;
      }
    } catch (error: any) {
      console.error("Failed to parse error response", error);
      errorMessage += `, Error parsing response: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    const textResponse = await response.text();
    try {
      return JSON.parse(textResponse);
    } catch {
      return textResponse as any;
    }
  }

    return response.json();
}

export function getFairApiUrl(): string {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        return process.env.NEXT_PUBLIC_PROD_FAIR_API_URL || '';
    } else {
        return process.env.NEXT_PUBLIC_LOCAL_FAIR_API_URL || '';
    }
}

export function getFairProviderPubApiKey(): string {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        return process.env.NEXT_PUBLIC_PROD_FAIR_PROVIDER_PUB_KEY || '';
    } else {
        return process.env.NEXT_PUBLIC_LOCAL_FAIR_PROVIDER_PUB_KEY || '';
    }
}

export function getStripePublishableKey(): string {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        return process.env.NEXT_PUBLIC_PROD_STRIPE_PUBLISHABLE_KEY || '';
    } else {
        return process.env.NEXT_PUBLIC_LOCAL_STRIPE_PUBLISHABLE_KEY || '';
    }
}

export function getStripeSecretKey(): string {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        return process.env.PROD_STRIPE_SECRET_KEY || '';
    } else {
        return process.env.LOCAL_STRIPE_SECRET_KEY || '';
    }
}

export function getStripePriceID(): string {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        return process.env.PROD_STRIPE_PRICE_ID || '';
    } else if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
        return process.env.PREVIEW_STRIPE_PRICE_ID || '';
    } else {
        return process.env.LOCAL_STRIPE_PRICE_ID || '';
    }
}

export function getOmnisendApiKey(): string {
    return process.env.NEXT_PUBLIC_OMNISEND_API_KEY || '';
}


export const FAIR_API_VERSION = "2024-07-04";