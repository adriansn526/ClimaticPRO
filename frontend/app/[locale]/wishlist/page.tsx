import { Metadata } from 'next';
import WishlistClient from '@/components/wishlist/WishlistClient';

export const metadata: Metadata = {
    title: 'Lista de Favorite | ClimaticPro',
    description: 'Produsele tale favorite salvate pentru mai târziu',
};

export default function WishlistPage() {
    return <WishlistClient />;
}
