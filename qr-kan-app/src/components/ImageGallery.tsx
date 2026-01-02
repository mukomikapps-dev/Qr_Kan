"use client";
import { useState } from "react";
import Image from "next/image";

type ImageGalleryProps = {
	images: string[];
	className?: string;
};

export default function ImageGallery({ images, className = "" }: ImageGalleryProps) {
	const [lightboxImage, setLightboxImage] = useState<string | null>(null);

	if (images.length === 0) return null;

	return (
		<>
			<div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${className}`}>
				{images.map((url, index) => (
					<div
						key={index}
						onClick={() => setLightboxImage(url)}
						className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-zinc-100 group"
					>
						<Image
							src={url}
							alt={`Gallery ${index + 1}`}
							fill
							sizes="(max-width: 768px) 50vw, 33vw"
							className="object-cover transition-transform group-hover:scale-110"
							loading="lazy"
						/>
						<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
					</div>
				))}
			</div>

			{/* Lightbox */}
			{lightboxImage && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
					onClick={() => setLightboxImage(null)}
				>
					<button
						onClick={() => setLightboxImage(null)}
						className="absolute top-4 right-4 text-white hover:text-zinc-300 text-2xl"
					>
						×
					</button>
					<div className="relative max-h-[90vh] max-w-[90vw] w-full aspect-square">
						<Image
							src={lightboxImage}
							alt="Lightbox"
							fill
							sizes="90vw"
							className="object-contain"
							onClick={(e) => e.stopPropagation()}
							unoptimized
						/>
					</div>
				</div>
			)}
		</>
	);
}




