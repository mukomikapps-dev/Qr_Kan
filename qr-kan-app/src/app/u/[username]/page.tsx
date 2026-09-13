import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { profiles, blocks, blockVariants } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import Link from "next/link";
import VisitBeacon from "./visit-beacon";
import { getThemePreset, getThemeClasses, type ThemePreset } from "@/lib/theme-presets";
import { selectVariant } from "@/lib/ab-testing";
import { getBgPattern } from "@/lib/bg-patterns";
import { LinkBlockWithIcon, SocialBlockWithIcon, WhatsAppBlockWithIcon, MarketplaceBlockWithIcon } from "./BlockWithIcon";
import TrackImpression from "./track-impression";
import dynamicImport from "next/dynamic";
import ShareButton from "./ShareButton";
import FloatingQRButton from "./FloatingQRButton";

// Lazy load heavy components for better initial page load
const Carousel = dynamicImport(() => import("@/components/Carousel"), {
	loading: () => <div className="w-full h-64 bg-zinc-100 animate-pulse rounded-xl" />,
	ssr: true,
});
const CountdownTimer = dynamicImport(() => import("@/components/CountdownTimer"), {
	loading: () => <div className="w-full h-20 bg-zinc-100 animate-pulse rounded-xl" />,
	ssr: true,
});
const ImageGallery = dynamicImport(() => import("@/components/ImageGallery"), {
	loading: () => <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
		{[...Array(6)].map((_, i) => (
			<div key={i} className="aspect-square bg-zinc-100 animate-pulse rounded-lg" />
		))}
	</div>,
	ssr: true,
});
import type { Metadata } from "next";

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate metadata for SEO and social sharing
export async function generateMetadata(context: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await context.params;
  const normalized = username.toLowerCase();

  let profile: any;
  try {
    profile = (
      await db.select().from(profiles).where(eq(profiles.username, normalized))
    )[0];
  } catch (error: any) {
    // If category column doesn't exist yet, select without it
    if (error?.message?.includes('category') || error?.code === '42703') {
      profile = (await db
        .select({
          id: profiles.id,
          userId: profiles.userId,
          username: profiles.username,
          displayName: profiles.displayName,
          bio: profiles.bio,
          avatarUrl: profiles.avatarUrl,
          logoUrl: profiles.logoUrl,
          bgType: profiles.bgType,
          bgSolidColor: profiles.bgSolidColor,
          bgImageUrl: profiles.bgImageUrl,
          bgPatternId: profiles.bgPatternId,
          bgGradientColors: profiles.bgGradientColors,
          showAvatar: profiles.showAvatar,
          showDisplayName: profiles.showDisplayName,
          showBio: profiles.showBio,
          showLogo: profiles.showLogo,
          showQr: profiles.showQr,
          showIcons: profiles.showIcons,
          stickyHeaderBg: profiles.stickyHeaderBg,
          themePresetId: profiles.themePresetId,
          themeJson: profiles.themeJson,
          useCustomColors: profiles.useCustomColors,
          customColors: profiles.customColors,
          detailedColors: profiles.detailedColors,
          status: profiles.status,
          statusType: profiles.statusType,
          coverImageUrl: profiles.coverImageUrl,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.username, normalized)))[0];
    } else {
      throw error;
    }
  }

  if (!profile) {
    return {
      title: "Profile Not Found",
    };
  }

  const title = `${profile.displayName} (@${profile.username})`;
  const description = profile.bio || `Check out @${profile.username}'s profile`;
  const url = `https://qrkan.com/@${profile.username}`;
  const ogImage = `https://qrkan.com/api/og/${profile.username}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    icons: {
      icon: profile.avatarUrl || "/default-avatar.svg",
      shortcut: profile.avatarUrl || "/default-avatar.svg",
      apple: profile.avatarUrl || "/default-avatar.svg",
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "QR Kan",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "id_ID",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function UserPage(context: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await context.params;
  const normalized = username.toLowerCase();

  let profile: any;
  try {
    profile = (
      await db.select().from(profiles).where(eq(profiles.username, normalized))
    )[0];
  } catch (error: any) {
    // If category column doesn't exist yet, select without it
    if (error?.message?.includes('category') || error?.code === '42703') {
      profile = (await db
        .select({
          id: profiles.id,
          userId: profiles.userId,
          username: profiles.username,
          displayName: profiles.displayName,
          bio: profiles.bio,
          avatarUrl: profiles.avatarUrl,
          logoUrl: profiles.logoUrl,
          bgType: profiles.bgType,
          bgSolidColor: profiles.bgSolidColor,
          bgImageUrl: profiles.bgImageUrl,
          bgPatternId: profiles.bgPatternId,
          bgGradientColors: profiles.bgGradientColors,
          showAvatar: profiles.showAvatar,
          showDisplayName: profiles.showDisplayName,
          showBio: profiles.showBio,
          showLogo: profiles.showLogo,
          showQr: profiles.showQr,
          showIcons: profiles.showIcons,
          stickyHeaderBg: profiles.stickyHeaderBg,
          themePresetId: profiles.themePresetId,
          themeJson: profiles.themeJson,
          useCustomColors: profiles.useCustomColors,
          customColors: profiles.customColors,
          detailedColors: profiles.detailedColors,
          status: profiles.status,
          statusType: profiles.statusType,
          coverImageUrl: profiles.coverImageUrl,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.username, normalized)))[0];
    } else {
      throw error;
    }
  }
  
  if (!profile) return notFound();

  // Theme: prioritize preset, fallback to custom themeJson
  let theme: ThemePreset | null = null;
  if ((profile as any).themePresetId) {
    theme = getThemePreset((profile as any).themePresetId) ?? null;
  }
  
  // Fallback to old theme system if no preset
  if (!theme) {
    let primary = "black";
    let background = "zinc";
    try {
      if (profile.themeJson) {
        const t = JSON.parse(profile.themeJson as any);
        primary = t.primary ?? primary;
        background = t.background ?? background;
      }
    } catch {}
    // Create a fake preset object for old theme
    theme = {
      id: "custom",
      name: "Custom",
      description: "",
      primary: primary === "emerald" ? "#10b981" : primary === "orange" ? "#f97316" : "#000000",
      secondary: "#ffffff",
      background: background === "zinc" ? "#f4f4f5" : "#ffffff",
      text: "#18181b",
      borderRadius: "xl",
      fontFamily: "sans",
      buttonStyle: "solid",
      cardStyle: "border",
    };
  }
  
  // Apply custom colors only if useCustomColors is enabled
  if ((profile as any).useCustomColors && (profile as any).customColors) {
    try {
      const custom = JSON.parse((profile as any).customColors);
      theme = {
        ...theme,
        primary: custom.primary ?? theme.primary,
        secondary: custom.secondary ?? theme.secondary,
        background: custom.background ?? theme.background,
        text: custom.text ?? theme.text,
      };
    } catch {}
  }
  
  const classes = getThemeClasses(theme);

  const now = new Date();
  const allBlocks = await db
    .select()
    .from(blocks)
    .where(eq(blocks.profileId, profile.id));

  // Process blocks first to get visible block IDs
  const profileBlocks = allBlocks
    .sort((a: any, b: any) => a.order - b.order)
    .filter((b: any) => {
      // Filter by visibility
      if (!b.isVisible) return false;
      // Filter by scheduled content (Pro feature)
      if (b.scheduledFrom || b.scheduledTo) {
        const from = b.scheduledFrom ? new Date(b.scheduledFrom) : null;
        const to = b.scheduledTo ? new Date(b.scheduledTo) : null;
        if (from && now < from) return false; // Not yet started
        if (to && now > to) return false; // Already ended
      }
      return true;
    });

  // Fetch variants for visible blocks only (optimized)
  const blockIds = profileBlocks.map((b: any) => b.id);
  const allVariants = blockIds.length > 0
    ? await db.select().from(blockVariants).where(inArray(blockVariants.blockId, blockIds))
    : [];
  
  // Group variants by blockId
  const variantsByBlock = new Map<string, any[]>();
  for (const v of allVariants) {
    if (!variantsByBlock.has(v.blockId)) {
      variantsByBlock.set(v.blockId, []);
    }
    variantsByBlock.get(v.blockId)!.push(v);
  }

  // Check if icons should be shown
  const showIcons = (profile as any).showIcons !== false;
  const bgType = (profile as any).bgType || "none";
  const bgSolidColor = (profile as any).bgSolidColor;
  const bgImageUrl = (profile as any).bgImageUrl;
  const bgPatternId = (profile as any).bgPatternId;
  const bgGradientColors = (profile as any).bgGradientColors;
  const bgPattern = bgPatternId ? getBgPattern(bgPatternId) : null;
  
  // Parse gradient colors
  let gradientColors = { color1: "#667eea", color2: "#764ba2", color3: "#f093fb" };
  try {
    if (bgGradientColors) {
      gradientColors = { ...gradientColors, ...JSON.parse(bgGradientColors) };
    }
  } catch {}
  
  // Parse detailed colors
  const detailedColorsData = (profile as any).detailedColors;
  let detailedColors = {
    useTextColor: false,
    textColor: theme.text,
    useHeaderColor: false,
    headerColor: theme.text,
    useTitleColor: false,
    titleColor: theme.text,
    useButtonColor: false,
    buttonColor: theme.primary,
    useLinkColor: false,
    linkColor: "#3b82f6"
  };
  try {
    if (detailedColorsData) {
      detailedColors = { ...detailedColors, ...JSON.parse(detailedColorsData) };
    }
  } catch {}

  // Structured Data for SEO (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": profile.displayName,
      "alternateName": `@${profile.username}`,
      "description": profile.bio || `Profile page for @${profile.username}`,
      "url": `https://qrkan.com/@${profile.username}`,
      "image": profile.avatarUrl || profile.logoUrl || undefined,
    },
    "url": `https://qrkan.com/@${profile.username}`,
    "description": profile.bio || `Check out @${profile.username}'s profile on QR Kan`,
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div 
        className={`min-h-screen ${classes.fontFamily} relative`} 
        style={{ 
          backgroundColor: theme.background, 
          color: theme.text,
          minHeight: '100vh', // Fallback for Safari
        }}
      >
      {/* Background - based on bgType */}
      {bgType === "solid" && bgSolidColor ? (
        <>
          {/* Solid Color Background */}
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: bgSolidColor }}
          />
        </>
      ) : bgType === "image" && bgImageUrl ? (
        <>
          {/* Custom Image Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgImageUrl})` }}
          />
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)', // Safari support
            }}
          />
        </>
      ) : bgType === "pattern" && bgPattern ? (
        <>
          {/* Pattern Background */}
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundImage: `url("${bgPattern.dataUrl}")`,
              backgroundRepeat: "repeat",
            }}
          />
        </>
      ) : bgType === "gradient" ? (
        <>
          {/* Gradient Background */}
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(135deg, ${gradientColors.color1} 0%, ${gradientColors.color2} 50%, ${gradientColors.color3} 100%)`
            }}
          />
        </>
      ) : null}
      
      <div className="relative mx-auto w-full max-w-lg md:max-w-2xl px-6 md:px-8 py-10 md:py-12">
        {/* visit tracking */}
        <VisitBeacon username={profile.username} />
        
        {/* Avatar & Username - Sticky Header */}
        <div 
          className={`sticky top-0 z-50 flex items-center gap-3 md:gap-4 py-3 md:py-4 px-6 mb-6 ${(profile as any).stickyHeaderBg !== false ? 'backdrop-blur-sm' : ''}`}
          style={{ 
            marginLeft: '-1.5rem', // -mx-6 equivalent, more Safari-friendly
            marginRight: '-1.5rem',
            backgroundColor: (profile as any).stickyHeaderBg !== false 
              ? `${theme.background}ee` 
              : 'transparent',
            borderBottom: (profile as any).stickyHeaderBg !== false 
              ? `1px solid ${theme.text}10` 
              : 'none',
            backdropFilter: (profile as any).stickyHeaderBg !== false ? 'blur(8px)' : 'none',
            WebkitBackdropFilter: (profile as any).stickyHeaderBg !== false ? 'blur(8px)' : 'none', // Safari support
            position: 'sticky' as const,
          }}
        >
          {(profile as any).showAvatar !== false ? (
            <img
              src={profile.avatarUrl || "/default-avatar.svg"}
              alt={`Avatar ${profile.username}`}
              className="h-12 w-12 md:h-20 md:w-20 rounded-full object-cover border-2 md:border-[3px]"
              style={{ borderColor: theme.primary }}
            />
          ) : null}
          <div className="flex-1">
            <h1 
              className="text-lg md:text-2xl font-semibold leading-tight" 
              style={{ color: detailedColors.useHeaderColor ? detailedColors.headerColor : theme.text }}
            >
              @{profile.username}
            </h1>
            {(profile as any).showDisplayName !== false ? (
              <p 
                className="text-sm md:text-lg opacity-80" 
                style={{ color: detailedColors.useTitleColor ? detailedColors.titleColor : theme.text }}
              >
                {profile.displayName}
              </p>
            ) : null}
          </div>
          <ShareButton 
            url={`/@${profile.username}`}
            title={`${profile.displayName} (@${profile.username})`}
            theme={theme}
          />
        </div>
        
        <header className="mb-8">
          {/* Status - Below Display Name */}
          {(profile as any).status && (
            <div className="mb-3 flex justify-center">
              {(profile as any).statusType === "image" ? (
                <div className="relative h-10 w-10 md:h-14 md:w-14 rounded-full overflow-hidden border-2 md:border-[3px]" style={{ borderColor: theme.primary }}>
                  <img
                    src={(profile as any).status}
                    alt="Status"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <span 
                  className="inline-flex items-center rounded-full px-3 py-1 md:px-5 md:py-2 text-xs md:text-base font-medium"
                  style={{ 
                    backgroundColor: `${theme.primary}20`,
                    color: theme.primary
                  }}
                >
                  {(profile as any).status}
                </span>
              )}
            </div>
          )}
          
          {/* Bio - Below Avatar */}
          {(profile as any).showBio !== false && profile.bio ? (
            <p 
              className="mb-4 text-sm md:text-lg opacity-70" 
              style={{ color: detailedColors.useTextColor ? detailedColors.textColor : theme.text }}
            >
              {profile.bio}
            </p>
          ) : null}
          
          {/* Logo - Center */}
          {(profile as any).showLogo !== false ? (
            <div className="text-center mb-4">
              <img
                src={profile.logoUrl || "/default-logo.svg"}
                alt="logo"
                className="mx-auto h-10 md:h-16 w-auto object-contain"
              />
            </div>
          ) : null}
          
          {/* QR - Center */}
          {profile.showQr !== false ? (
            <div className="text-center">
              <img
                src={`/api/qr/${encodeURIComponent(profile.username)}?color=${encodeURIComponent(theme.primary.replace('#', ''))}`}
                alt={`QR untuk @${profile.username}`}
                className="mx-auto h-32 w-32 md:h-40 md:w-40"
              />
            </div>
          ) : null}
        </header>
        <main 
          className="flex flex-col gap-3 md:gap-4"
        >
          {profileBlocks.map((b) => {
            let data = JSON.parse(b.dataJson) as Record<string, unknown>;
            let variantId: string | null = null;
            
            // A/B Testing: check for variants and select one
            if (b.type === "link" && variantsByBlock.has(b.id)) {
              const variants = variantsByBlock.get(b.id)!;
              const selected = selectVariant(variants);
              if (selected) {
                data = JSON.parse(selected.dataJson);
                variantId = selected.id;
              }
            }
            
            if (b.type === "link") {
              const title = String(data.title ?? "Link");
              const redirect = variantId 
                ? `/r/${encodeURIComponent(b.id)}?v=${encodeURIComponent(variantId)}`
                : `/r/${encodeURIComponent(b.id)}`;
              return (
                <div key={b.id}>
                  {variantId && <TrackImpression variantId={variantId} />}
                  <LinkBlockWithIcon
                    href={redirect}
                    className={`${classes.borderRadius} px-5 py-4 md:px-7 md:py-6 text-center text-base md:text-xl font-medium transition flex items-center justify-center gap-2 md:gap-3`}
                    style={{
                      backgroundColor: detailedColors.useButtonColor ? detailedColors.buttonColor : theme.primary,
                      color: theme.background,
                    }}
                    showIcon={showIcons}
                    title={title}
                    variantId={variantId || undefined}
                  />
                </div>
              );
            }
            if (b.type === "heading") {
              const heading = String((data as any).heading ?? "");
              const size = String((data as any).size ?? "large");
              const fontSize = size === "large" ? "text-3xl md:text-5xl" : size === "medium" ? "text-2xl md:text-4xl" : "text-xl md:text-3xl";
              const headingColor = detailedColors.useTitleColor ? detailedColors.titleColor : theme.text;
              return (
                <h2
                  key={b.id}
                  className={`${fontSize} font-bold text-center`}
                  style={{ color: headingColor }}
                >
                  {heading}
                </h2>
              );
            }
            if (b.type === "text") {
              const textColor = detailedColors.useTextColor ? detailedColors.textColor : theme.text;
              return (
                <div
                  key={b.id}
                  className={`${classes.borderRadius} px-5 py-4 md:px-7 md:py-6 text-center text-base md:text-xl opacity-90`}
                  style={{
                    backgroundColor: theme.secondary,
                    color: textColor,
                    border: theme.cardStyle === "border" ? `1px solid ${theme.text}20` : "none",
                  }}
                >
                  {String((data as any).text ?? "")}
                </div>
              );
            }
            if (b.type === "htmltext") {
              const htmlContent = String((data as any).htmlContent ?? "");
              const textColor = detailedColors.useTextColor ? detailedColors.textColor : theme.text;
              
              // Extract body content from HTML if it contains full document structure
              let contentToRender = htmlContent;
              try {
                if (htmlContent.includes("<!DOCTYPE") || htmlContent.includes("<html")) {
                  // This is a full HTML document, extract content between <body> tags
                  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                  if (bodyMatch && bodyMatch[1]) {
                    contentToRender = bodyMatch[1].trim();
                  }
                }
              } catch (e) {
                // If parsing fails, use original content
                console.error("Error parsing HTML content:", e);
              }
              
              return (
                <div
                  key={b.id}
                  className={`${classes.borderRadius} html-block-content w-full`}
                  style={{
                    backgroundColor: theme.secondary,
                    color: textColor,
                    border: theme.cardStyle === "border" ? `1px solid ${theme.text}20` : "none",
                    overflow: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: contentToRender }}
                />
              );
            }
            if (b.type === "spacer") {
              const height = Number((data as any).height ?? 40);
              return (
                <div
                  key={b.id}
                  style={{ height: `${height}px` }}
                  className="w-full"
                />
              );
            }
            if (b.type === "social") {
              const platform = String((data as any).platform ?? "social");
              const redirect = `/r/${encodeURIComponent(b.id)}`;
              const btnBgColor = detailedColors.useButtonColor ? detailedColors.buttonColor : theme.primary;
              return (
                <SocialBlockWithIcon
                  key={b.id}
                  href={redirect}
                  className={`${classes.borderRadius} px-5 py-4 md:px-6 md:py-5 text-center text-base md:text-lg font-medium transition flex items-center justify-center gap-2`}
                  style={{
                    backgroundColor: btnBgColor,
                    color: theme.background,
                    border: theme.buttonStyle === "outline" ? `2px solid ${btnBgColor}` : "none",
                  }}
                  showIcon={showIcons}
                  platform={platform}
                />
              );
            }
            if (b.type === "image") {
              const src = String((data as any).imageUrl ?? "");
              const alt = String((data as any).alt ?? "");
              if (!src) return null;
              return <img key={b.id} src={src} alt={alt} className={`w-full ${classes.borderRadius}`} />;
            }
          if (b.type === "video") {
            const videoUrl = String((data as any).videoUrl ?? "");
            if (!videoUrl) return null;
            
            // Extract YouTube video ID from various URL formats
            let embedUrl = "";
            try {
              const url = new URL(videoUrl);
              let videoId = "";
              
              if (url.hostname.includes("youtube.com")) {
                // Format: youtube.com/watch?v=VIDEO_ID or youtube.com/embed/VIDEO_ID
                videoId = url.searchParams.get("v") || url.pathname.split("/embed/")[1]?.split("?")[0] || "";
              } else if (url.hostname.includes("youtu.be")) {
                // Format: youtu.be/VIDEO_ID
                videoId = url.pathname.split("/")[1]?.split("?")[0] || "";
              }
              
              if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
              }
            } catch {
              // Fallback: jika bukan URL valid, coba extract dari string
              const match = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^?&/]+)/);
              if (match && match[1]) {
                embedUrl = `https://www.youtube.com/embed/${match[1]}`;
              }
            }
            
            if (!embedUrl) return null;
            
            return (
              <div key={b.id} className={`aspect-video w-full overflow-hidden ${classes.borderRadius}`}>
                <iframe
                  className="h-full w-full"
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title="YouTube Video"
                />
              </div>
            );
          }
            if (b.type === "svg") {
              const svgUrl = String((data as any).svgUrl ?? "");
              if (!svgUrl) return null;
              return <img key={b.id} src={svgUrl} alt="svg" className={`w-full ${classes.borderRadius}`} />;
            }
            if (b.type === "whatsapp") {
              const redirect = `/r/${encodeURIComponent(b.id)}`;
              return (
                <WhatsAppBlockWithIcon
                  key={b.id}
                  href={redirect}
                  className={`${classes.borderRadius} px-5 py-4 md:px-6 md:py-5 text-center text-base md:text-lg font-medium transition flex items-center justify-center gap-2`}
                  style={{
                    backgroundColor: detailedColors.useButtonColor ? detailedColors.buttonColor : theme.primary,
                    color: theme.background,
                  }}
                  showIcon={showIcons}
                />
              );
            }
            if (b.type === "marketplace") {
              const platform = String((data as any).platform ?? "marketplace");
              const redirect = `/r/${encodeURIComponent(b.id)}`;
              return (
                <MarketplaceBlockWithIcon
                  key={b.id}
                  href={redirect}
                  className={`${classes.borderRadius} px-5 py-4 md:px-6 md:py-5 text-center text-base md:text-lg font-medium transition flex items-center justify-center gap-2`}
                  style={{
                    backgroundColor: detailedColors.useButtonColor ? detailedColors.buttonColor : theme.primary,
                    color: theme.background,
                  }}
                  showIcon={showIcons}
                  platform={platform}
                />
              );
            }
            if (b.type === "carousel") {
              const items = Array.isArray((data as any).items) ? (data as any).items : [];
              if (items.length === 0) return null;
              return (
                <div key={b.id} className={classes.borderRadius}>
                  <Carousel items={items} />
                </div>
              );
            }
            if (b.type === "countdown") {
              const targetDate = String((data as any).targetDate ?? "");
              const title = String((data as any).title ?? "");
              const message = String((data as any).message ?? "");
              if (!targetDate) return null;
              return (
                <div key={b.id} className={classes.borderRadius}>
                  <CountdownTimer targetDate={targetDate} title={title || undefined} message={message || undefined} />
                </div>
              );
            }
            if (b.type === "gallery") {
              const images = Array.isArray((data as any).images) ? (data as any).images : [];
              if (images.length === 0) return null;
              return (
                <div key={b.id} className={classes.borderRadius}>
                  <ImageGallery images={images} />
                </div>
              );
            }
            if (b.type === "richtext") {
              const content = String((data as any).content ?? "");
              if (!content) return null;
              const textColor = detailedColors.useTextColor ? detailedColors.textColor : theme.text;
              return (
                <div
                  key={b.id}
                  className={`${classes.borderRadius} px-5 py-4`}
                  style={{
                    backgroundColor: theme.secondary,
                    color: textColor,
                    border: theme.cardStyle === "border" ? `1px solid ${theme.text}20` : "none",
                  }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              );
            }
            return null;
          })}
        </main>
      </div>
      
      {/* Floating QR Button (Mobile Only) */}
      <FloatingQRButton 
        username={profile.username} 
        qrColor={theme.primary}
        theme={theme}
      />
      
      {/* Branding Footer */}
      <div className="fixed bottom-4 right-4 z-40">
        <a
          href="/"
          className="flex items-center gap-1.5 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors shadow-sm"
          title="QR Kan - Digital Profile Builder"
        >
          <span>Powered by</span>
          <span className="font-semibold text-emerald-600">QR Kan</span>
        </a>
      </div>
    </div>
    </>
  );
}


