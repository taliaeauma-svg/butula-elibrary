import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Okame Technical and Vocational College Library | Okame TVC Digital Resource Center",
  description: "Okame Technical and Vocational College Library is a digital library for TVET students and teachers — browse textbooks, past papers, and study materials online.",
  keywords: "Okame Technical and Vocational College Library, Okame TVC, TVET library, Kenya technical college resources, digital library",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
