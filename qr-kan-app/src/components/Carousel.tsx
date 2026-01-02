"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type CarouselItem = {
	imageUrl: string;
	title: string;
	url?: string;
	description?: string;
};

export default function Carousel({ items, className = "" }: { items: CarouselItem[]; className?: string }) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);
	const carouselRef = useRef<HTMLDivElement>(null);

	// Auto-play carousel
	useEffect(() => {
		if (items.length <= 1) return;
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % items.length);
		}, 5000); // Change slide every 5 seconds
		return () => clearInterval(interval);
	}, [items.length]);

	// Update scroll position when currentIndex changes
	useEffect(() => {
		if (carouselRef.current) {
			carouselRef.current.scrollTo({
				left: currentIndex * carouselRef.current.offsetWidth,
				behavior: "smooth",
			});
		}
	}, [currentIndex]);

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);
		setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
		setScrollLeft(carouselRef.current?.scrollLeft || 0);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging || !carouselRef.current) return;
		e.preventDefault();
		const x = e.pageX - (carouselRef.current.offsetLeft || 0);
		const walk = (x - startX) * 2;
		carouselRef.current.scrollLeft = scrollLeft - walk;
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true);
		setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0));
		setScrollLeft(carouselRef.current?.scrollLeft || 0);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging || !carouselRef.current) return;
		const x = e.touches[0].pageX - (carouselRef.current.offsetLeft || 0);
		const walk = (x - startX) * 2;
		carouselRef.current.scrollLeft = scrollLeft - walk;
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
		// Update currentIndex based on scroll position
		if (carouselRef.current) {
			const newIndex = Math.round(carouselRef.current.scrollLeft / carouselRef.current.offsetWidth);
			setCurrentIndex(newIndex);
		}
	};

	const goToSlide = (index: number) => {
		setCurrentIndex(index);
	};

	const goPrev = () => {
		setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
	};

	const goNext = () => {
		setCurrentIndex((prev) => (prev + 1) % items.length);
	};

	if (items.length === 0) return null;

	return (
		<div className={`relative ${className}`}>
			{/* Carousel Container */}
			<div
				ref={carouselRef}
				className="relative overflow-hidden rounded-lg"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				style={{
					cursor: isDragging ? "grabbing" : "grab",
					scrollSnapType: "x mandatory",
					scrollBehavior: "smooth",
					display: "flex",
					overflowX: "auto",
					scrollbarWidth: "none",
					msOverflowStyle: "none",
				}}
			>
				{items.map((item, index) => {
					const content = (
						<div
							key={index}
							className="flex-shrink-0 w-full"
							style={{
								scrollSnapAlign: "start",
							}}
						>
							<div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100">
								{item.imageUrl && (
									<Image
										src={item.imageUrl}
										alt={item.title}
										fill
										sizes="100vw"
										className="object-cover"
										loading={index === 0 ? "eager" : "lazy"}
										priority={index === 0}
									/>
								)}
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
								<div className="absolute bottom-0 left-0 right-0 p-4 text-white">
									<h3 className="text-lg font-semibold mb-1">{item.title}</h3>
									{item.description && (
										<p className="text-sm opacity-90">{item.description}</p>
									)}
								</div>
							</div>
						</div>
					);

					return item.url ? (
						<Link key={index} href={item.url} className="block" prefetch={false}>
							{content}
						</Link>
					) : (
						content
					);
				})}
			</div>

			{/* Navigation Arrows */}
			{items.length > 1 && (
				<>
					<button
						onClick={goPrev}
						className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition z-10"
						aria-label="Previous slide"
					>
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button
						onClick={goNext}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition z-10"
						aria-label="Next slide"
					>
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</>
			)}

			{/* Dots Indicator */}
			{items.length > 1 && (
				<div className="flex justify-center gap-2 mt-4">
					{items.map((_, index) => (
						<button
							key={index}
							onClick={() => goToSlide(index)}
							className={`h-2 rounded-full transition ${
								index === currentIndex ? "w-8 bg-emerald-600" : "w-2 bg-zinc-300"
							}`}
							aria-label={`Go to slide ${index + 1}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}




