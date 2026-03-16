"use server";
import { addGenericBlock } from "./actions";
import { redirect } from "next/navigation";

export async function submitGenericBlock(formData: FormData) {
	const username = String(formData.get("username") ?? "");
	const type = String(formData.get("type") ?? "");
	const fields: Record<string, string> = {};
	
	// Validate required fields
	if (!username || !type) return;
	
	// For image type, imageUrl is required
	if (type === "image") {
		const imageUrl = formData.get("imageUrl");
		if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.length) {
			throw new Error("Image URL is required");
		}
	}
	
	for (const key of [
		"title",
		"url",
		"text",
		"platform",
		"handle",
		"imageUrl",
		"alt",
		"videoUrl",
		"posterUrl",
		"svgUrl",
		"phone",
		"message",
		"heading",
		"size",
		"htmlContent",
		"height",
		"items",
		"images",
		"targetDate",
		"content",
	]) {
		const v = formData.get(key);
		if (typeof v === "string" && v.length) fields[key] = v;
	}
	
	await addGenericBlock(username, type as any, fields);
	redirect("/dashboard/editor"); // Stay on editor page to show new block
}
