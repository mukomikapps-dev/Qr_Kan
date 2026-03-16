"use client";

/**
 * Component to display notification when free tier quota has been exceeded
 */
export default function RateLimitNotice() {
	// Customize this to check user tier from context or props
	// TODO: Add logic to check user tier and quota usage
	
	const showNotice = false; // Set to true for testin

	if (!showNotice) {
		return null;
	}

	return (
		<div className="bg-red-500 text-white p-4 text-center font-bold text-sm">
			⚠️ Your Pro Plan quota is almost used up. Please upgrade or renew your plan to avoid service interruption.
		</div>
	);
}
