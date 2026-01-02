"use client";
import Link from "next/link";
import { getBlockIcon } from "@/lib/block-icons";

export function LinkBlockWithIcon({
	href,
	className,
	style,
	showIcon,
	title,
	variantId,
}: {
	href: string;
	className: string;
	style: React.CSSProperties;
	showIcon: boolean;
	title: string;
	variantId?: string;
}) {
	return (
		<Link href={href} className={className} style={style} data-variant-id={variantId} prefetch={false}>
			{showIcon ? getBlockIcon("link") : null}
			<span>{title}</span>
		</Link>
	);
}

export function SocialBlockWithIcon({
	href,
	className,
	style,
	showIcon,
	platform,
}: {
	href: string;
	className: string;
	style: React.CSSProperties;
	showIcon: boolean;
	platform: string;
}) {
	return (
		<Link href={href} className={className} style={style} prefetch={false}>
			{showIcon ? getBlockIcon("social", platform) : null}
			<span className="capitalize">{platform}</span>
		</Link>
	);
}

export function WhatsAppBlockWithIcon({
	href,
	className,
	style,
	showIcon,
}: {
	href: string;
	className: string;
	style: React.CSSProperties;
	showIcon: boolean;
}) {
	return (
		<Link href={href} className={className} style={style} prefetch={false}>
			{showIcon ? getBlockIcon("whatsapp") : null}
			<span>WhatsApp</span>
		</Link>
	);
}

export function MarketplaceBlockWithIcon({
	href,
	className,
	style,
	showIcon,
	platform,
}: {
	href: string;
	className: string;
	style: React.CSSProperties;
	showIcon: boolean;
	platform: string;
}) {
	return (
		<Link href={href} className={className} style={style} prefetch={false}>
			{showIcon ? getBlockIcon("marketplace") : null}
			<span className="capitalize">{platform}</span>
		</Link>
	);
}

