type Variant = {
	id: string;
	blockId: string;
	variantName: string;
	dataJson: string;
	trafficSplit: number;
	impressions: number;
	isActive: boolean;
};

/**
 * Select a variant based on weighted random (traffic split)
 * Returns the selected variant or null if no variants
 */
export function selectVariant(variants: Variant[]): Variant | null {
	const activeVariants = variants.filter((v) => v.isActive);
	if (activeVariants.length === 0) return null;

	// Normalize traffic split to sum to 100
	const totalSplit = activeVariants.reduce((sum, v) => sum + v.trafficSplit, 0);
	if (totalSplit === 0) return null;

	// Weighted random selection
	const random = Math.random() * totalSplit;
	let cumulative = 0;
	for (const variant of activeVariants) {
		cumulative += variant.trafficSplit;
		if (random < cumulative) {
			return variant;
		}
	}

	// Fallback to first variant
	return activeVariants[0];
}

