import { Geist, Geist_Mono, Poppins } from "next/font/google";
import localFont from "next/font/local";

export const moreSugar = localFont({
  src: "./fonts/MoreSugar-Regular.ttf",
  weight: "400",
});

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: "400",
});