import type { Metadata } from "next";
import Landing from "@/components/landing";

export const metadata: Metadata = {
  title: "ByteVoice Bangla · Voice AI for Healthcare",
  description: "বাংলাদেশের ডেন্টাল ক্লিনিক ও হাসপাতালের জন্য বাংলা ভয়েস এজেন্ট। Try ByteVoice’s live Bangla caller and see how it handles patient calls and appointments.",
};

export default function Home() {
  return <Landing />;
}
