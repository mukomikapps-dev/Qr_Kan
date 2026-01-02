import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import {
	faLink,
	faAlignLeft,
	faHashtag,
	faImage,
	faVideo,
	faCode,
	faShoppingCart,
	faImages,
	faClock,
	faFileText,
} from "@fortawesome/free-solid-svg-icons";
import {
	faInstagram,
	faTiktok,
	faTwitter,
	faYoutube,
	faFacebook,
	faLinkedin,
	faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";

export function getBlockIcon(type: string, platform?: string) {
	if (type === "link") {
		return <FontAwesomeIcon icon={faLink} className="h-4 w-4" />;
	}
	if (type === "text") {
		return <FontAwesomeIcon icon={faAlignLeft} className="h-4 w-4" />;
	}
	if (type === "social") {
		const p = (platform || "").toLowerCase();
		if (p === "instagram") {
			return <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" />;
		}
		if (p === "tiktok") {
			return <FontAwesomeIcon icon={faTiktok} className="h-4 w-4" />;
		}
		if (p === "twitter" || p === "x") {
			return <FontAwesomeIcon icon={faTwitter} className="h-4 w-4" />;
		}
		if (p === "youtube") {
			return <FontAwesomeIcon icon={faYoutube} className="h-4 w-4" />;
		}
		if (p === "facebook") {
			return <FontAwesomeIcon icon={faFacebook} className="h-4 w-4" />;
		}
		if (p === "linkedin") {
			return <FontAwesomeIcon icon={faLinkedin} className="h-4 w-4" />;
		}
		return <FontAwesomeIcon icon={faHashtag} className="h-4 w-4" />;
	}
	if (type === "image") {
		return <FontAwesomeIcon icon={faImage} className="h-4 w-4" />;
	}
	if (type === "video") {
		return <FontAwesomeIcon icon={faVideo} className="h-4 w-4" />;
	}
	if (type === "svg") {
		return <FontAwesomeIcon icon={faCode} className="h-4 w-4" />;
	}
	if (type === "whatsapp") {
		return <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />;
	}
	if (type === "marketplace") {
		return <FontAwesomeIcon icon={faShoppingCart} className="h-4 w-4" />;
	}
	if (type === "carousel") {
		return <FontAwesomeIcon icon={faImages} className="h-4 w-4" />;
	}
	if (type === "gallery") {
		return <FontAwesomeIcon icon={faImages} className="h-4 w-4" />;
	}
	if (type === "countdown") {
		return <FontAwesomeIcon icon={faClock} className="h-4 w-4" />;
	}
	if (type === "richtext") {
		return <FontAwesomeIcon icon={faFileText} className="h-4 w-4" />;
	}
	return null;
}

