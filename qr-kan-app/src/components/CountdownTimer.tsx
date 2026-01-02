"use client";
import { useState, useEffect } from "react";

type CountdownTimerProps = {
	targetDate: string;
	title?: string;
	message?: string;
	className?: string;
};

export default function CountdownTimer({
	targetDate,
	title,
	message,
	className = "",
}: CountdownTimerProps) {
	const [timeLeft, setTimeLeft] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
		expired: false,
	});

	useEffect(() => {
		const target = new Date(targetDate).getTime();

		const updateTimer = () => {
			const now = new Date().getTime();
			const difference = target - now;

			if (difference <= 0) {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
				return;
			}

			setTimeLeft({
				days: Math.floor(difference / (1000 * 60 * 60 * 24)),
				hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
				minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
				seconds: Math.floor((difference % (1000 * 60)) / 1000),
				expired: false,
			});
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [targetDate]);

	if (timeLeft.expired) {
		return (
			<div className={`text-center p-6 rounded-lg bg-zinc-100 ${className}`}>
				{message ? (
					<p className="text-lg font-semibold text-zinc-700">{message}</p>
				) : (
					<p className="text-lg font-semibold text-zinc-700">Countdown telah berakhir</p>
				)}
			</div>
		);
	}

	return (
		<div className={`text-center p-6 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 ${className}`}>
			{title && <h3 className="text-xl font-bold text-emerald-800 mb-4">{title}</h3>}
			<div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
				<div className="bg-white rounded-lg p-3 shadow-sm">
					<div className="text-2xl font-bold text-emerald-700">{String(timeLeft.days).padStart(2, "0")}</div>
					<div className="text-xs text-emerald-600 mt-1">Hari</div>
				</div>
				<div className="bg-white rounded-lg p-3 shadow-sm">
					<div className="text-2xl font-bold text-emerald-700">{String(timeLeft.hours).padStart(2, "0")}</div>
					<div className="text-xs text-emerald-600 mt-1">Jam</div>
				</div>
				<div className="bg-white rounded-lg p-3 shadow-sm">
					<div className="text-2xl font-bold text-emerald-700">{String(timeLeft.minutes).padStart(2, "0")}</div>
					<div className="text-xs text-emerald-600 mt-1">Menit</div>
				</div>
				<div className="bg-white rounded-lg p-3 shadow-sm">
					<div className="text-2xl font-bold text-emerald-700">{String(timeLeft.seconds).padStart(2, "0")}</div>
					<div className="text-xs text-emerald-600 mt-1">Detik</div>
				</div>
			</div>
		</div>
	);
}




