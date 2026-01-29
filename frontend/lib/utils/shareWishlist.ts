import type { WishlistItem } from '@/lib/hooks/useWishlist';

// Generate a shareable link for wishlist
export function generateShareableLink(wishlist: WishlistItem[]): string {
    // Encode wishlist data to base64
    const data = JSON.stringify(wishlist);
    const encoded = btoa(encodeURIComponent(data));

    // Generate share URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/wishlist/shared/${encoded}`;
}

// Decode shared wishlist from URL
export function decodeSharedWishlist(encoded: string): WishlistItem[] | null {
    try {
        const decoded = decodeURIComponent(atob(encoded));
        const wishlist = JSON.parse(decoded);
        return Array.isArray(wishlist) ? wishlist : null;
    } catch (error) {
        console.error('Error decoding shared wishlist:', error);
        return null;
    }
}

// Copy to clipboard with fallback
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            } catch (error) {
                console.error('Fallback copy failed:', error);
                document.body.removeChild(textArea);
                return false;
            }
        }
    } catch (error) {
        console.error('Copy to clipboard failed:', error);
        return false;
    }
}

// Generate WhatsApp share link
export function generateWhatsAppLink(shareUrl: string, productCount: number): string {
    const message = `Verifică lista mea de produse favorite de la ClimaticPro! (${productCount} produse)\n\n${shareUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Generate Email share link
export function generateEmailLink(shareUrl: string, productCount: number): string {
    const subject = 'Lista mea de produse favorite - ClimaticPro';
    const body = `Bună,\n\nAm creat o listă cu ${productCount} produse de la ClimaticPro pe care le-aș dori.\n\nPoți vedea lista aici:\n${shareUrl}\n\nMulțumesc!`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
