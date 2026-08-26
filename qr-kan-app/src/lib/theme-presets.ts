export type ThemePreset = {
	id: string;
	name: string;
	description: string;
	primary: string;
	secondary: string;
	background: string;
	text: string;
	borderRadius: "none" | "sm" | "md" | "lg" | "xl" | "full";
	fontFamily: "sans" | "serif" | "mono";
	buttonStyle: "solid" | "outline" | "soft";
	cardStyle: "flat" | "shadow" | "border";
};

export const THEME_PRESETS: ThemePreset[] = [
	{
		id: "plain",
		name: "Plain",
		description: "Tanpa styling — untuk konten HTML block / custom CSS sendiri",
		primary: "#000000",
		secondary: "#ffffff",
		background: "#ffffff",
		text: "#000000",
		borderRadius: "none",
		fontFamily: "sans",
		buttonStyle: "solid",
		cardStyle: "flat",
	},
	{
		id: "monochrome",
		name: "Monochrome",
		description: "Hitam putih klasik, fully customizable",
		primary: "#000000",
		secondary: "#ffffff",
		background: "#ffffff",
		text: "#000000",
		borderRadius: "lg",
		fontFamily: "sans",
		buttonStyle: "solid",
		cardStyle: "flat",
	},
	{
		id: "minimal",
		name: "Minimal",
		description: "Bersih, simpel, profesional",
		primary: "#000000",
		secondary: "#ffffff",
		background: "#f9fafb",
		text: "#18181b",
		borderRadius: "md",
		fontFamily: "sans",
		buttonStyle: "solid",
		cardStyle: "border",
	},
	{
		id: "bold",
		name: "Bold",
		description: "Berani, kontras tinggi, eye-catching",
		primary: "#dc2626",
		secondary: "#0a0a0a",
		background: "#ffffff",
		text: "#0a0a0a",
		borderRadius: "sm",
		fontFamily: "sans",
		buttonStyle: "solid",
		cardStyle: "shadow",
	},
	{
		id: "gradient",
		name: "Gradient",
		description: "Modern, colorful, vibrant",
		primary: "#8b5cf6",
		secondary: "#ec4899",
		background: "#faf5ff",
		text: "#1f2937",
		borderRadius: "xl",
		fontFamily: "sans",
		buttonStyle: "soft",
		cardStyle: "flat",
	},
	{
		id: "neon",
		name: "Neon",
		description: "Dark mode, neon accents, futuristic",
		primary: "#06b6d4",
		secondary: "#a855f7",
		background: "#0f172a",
		text: "#f1f5f9",
		borderRadius: "lg",
		fontFamily: "sans",
		buttonStyle: "outline",
		cardStyle: "border",
	},
	{
		id: "elegant",
		name: "Elegant",
		description: "Klasik, serif, sophisticated",
		primary: "#854d0e",
		secondary: "#1c1917",
		background: "#fefce8",
		text: "#292524",
		borderRadius: "sm",
		fontFamily: "serif",
		buttonStyle: "outline",
		cardStyle: "shadow",
	},
	{
		id: "pastel",
		name: "Pastel",
		description: "Soft colors, friendly, approachable",
		primary: "#f472b6",
		secondary: "#a78bfa",
		background: "#fdf2f8",
		text: "#374151",
		borderRadius: "full",
		fontFamily: "sans",
		buttonStyle: "soft",
		cardStyle: "flat",
	},
	{
		id: "tiktok-creator",
		name: "TikTok Creator",
		description: "Vibrant, energetic, perfect for content creators",
		primary: "#ff0050",
		secondary: "#00f2ea",
		background: "#000000",
		text: "#ffffff",
		borderRadius: "xl",
		fontFamily: "sans",
		buttonStyle: "solid",
		cardStyle: "shadow",
	},
	{
		id: "drama-royal",
		name: "Drama Royal",
		description: "Elegant purple, perfect for drama/entertainment content",
		primary: "#9333ea",
		secondary: "#fbbf24",
		background: "#1e1b4b",
		text: "#e9d5ff",
		borderRadius: "lg",
		fontFamily: "sans",
		buttonStyle: "soft",
		cardStyle: "border",
	},
	{
		id: "creator-glow",
		name: "Creator Glow",
		description: "Bright, modern, eye-catching for influencers",
		primary: "#f59e0b",
		secondary: "#ec4899",
		background: "#0f172a",
		text: "#f1f5f9",
		borderRadius: "full",
		fontFamily: "sans",
		buttonStyle: "solid",
		cardStyle: "shadow",
	},
	{
		id: "viral-vibe",
		name: "Viral Vibe",
		description: "Trendy, colorful, perfect for viral content creators",
		primary: "#10b981",
		secondary: "#3b82f6",
		background: "#f0fdf4",
		text: "#065f46",
		borderRadius: "xl",
		fontFamily: "sans",
		buttonStyle: "soft",
		cardStyle: "flat",
	},
];

export function getThemePreset(id: string): ThemePreset | undefined {
	return THEME_PRESETS.find((t) => t.id === id);
}

export function getThemeClasses(preset: ThemePreset) {
	const borderRadiusMap = {
		none: "rounded-none",
		sm: "rounded-sm",
		md: "rounded-md",
		lg: "rounded-lg",
		xl: "rounded-xl",
		full: "rounded-full",
	};

	const fontFamilyMap = {
		sans: "font-sans",
		serif: "font-serif",
		mono: "font-mono",
	};

	return {
		borderRadius: borderRadiusMap[preset.borderRadius],
		fontFamily: fontFamilyMap[preset.fontFamily],
	};
}

