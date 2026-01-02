/**
 * Moota API Client
 * Documentation: https://moota.co/integrasi-moota/
 */

const MOOTA_API_BASE = process.env.MOOTA_API_BASE || "https://app.moota.co/api/v1";
const MOOTA_API_KEY = process.env.MOOTA_API_KEY;

interface MootaMutation {
  mutation_id: string;
  bank_id: string;
  account_number: string;
  bank_type: string;
  date: string;
  amount: number;
  description: string;
  type: string; // "credit" or "debit"
  balance: number;
}

interface MootaBank {
  bank_id: string;
  bank_type: string;
  account_number: string;
  account_name: string;
}

/**
 * Get Moota API headers
 */
function getMootaHeaders() {
  if (!MOOTA_API_KEY) {
    throw new Error("MOOTA_API_KEY is not configured");
  }

  return {
    "Authorization": `Bearer ${MOOTA_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Get list of connected banks
 */
export async function getMootaBanks(): Promise<MootaBank[]> {
  if (!MOOTA_API_KEY) {
    console.warn("MOOTA_API_KEY not configured, skipping Moota API call");
    return [];
  }

  try {
    const response = await fetch(`${MOOTA_API_BASE}/bank`, {
      method: "GET",
      headers: getMootaHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Moota API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Moota API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Moota banks response:", data);
    return data.data || data || [];
  } catch (error) {
    console.error("Error fetching Moota banks:", error);
    // Return empty array instead of throwing to allow fallback
    return [];
  }
}

/**
 * Get mutations (transactions) for a bank account
 */
export async function getMootaMutations(
  bankId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    type?: "credit" | "debit";
    limit?: number;
  }
): Promise<MootaMutation[]> {
  if (!MOOTA_API_KEY) {
    console.warn("MOOTA_API_KEY not configured, skipping Moota API call");
    return [];
  }

  try {
    const params = new URLSearchParams();
    if (options?.startDate) params.append("start_date", options.startDate);
    if (options?.endDate) params.append("end_date", options.endDate);
    if (options?.type) params.append("type", options.type);
    if (options?.limit) params.append("limit", options.limit.toString());

    const queryString = params.toString();
    const url = `${MOOTA_API_BASE}/bank/${bankId}/mutation${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getMootaHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Moota API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching Moota mutations:", error);
    throw error;
  }
}

/**
 * Verify payment by checking mutations
 * This should be called when webhook is received or periodically to check pending payments
 */
export async function verifyMootaPayment(
  bankId: string,
  expectedAmount: number,
  expectedDescription?: string,
  sinceDate?: Date
): Promise<MootaMutation | null> {
  const mutations = await getMootaMutations(bankId, {
    startDate: sinceDate?.toISOString().split("T")[0],
    type: "credit",
    limit: 100,
  });

  // Find matching mutation
  for (const mutation of mutations) {
    if (mutation.amount === expectedAmount) {
      // If description is provided, check if it matches
      if (expectedDescription) {
        if (mutation.description.toLowerCase().includes(expectedDescription.toLowerCase())) {
          return mutation;
        }
      } else {
        return mutation;
      }
    }
  }

  return null;
}

/**
 * Format virtual account number for display
 * Moota typically uses virtual account format based on bank type
 */
export function formatVirtualAccount(accountNumber: string, bankType?: string): string {
  // Format: XXXX-XXXX-XXXX-XXXX (add dashes every 4 digits)
  const cleaned = accountNumber.replace(/\D/g, "");
  return cleaned.match(/.{1,4}/g)?.join("-") || accountNumber;
}

