import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Vault Auction - Luxury Scheduled Auctions',
  description: 'Synchronized real-time scheduled luxury auctions platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-luxury-bg text-luxury-text min-h-screen flex flex-col justify-between">
        <div>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-8 w-full">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
