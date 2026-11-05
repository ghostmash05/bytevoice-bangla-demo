import type { Metadata } from "next";
import Landing from "@/components/landing";

export const metadata: Metadata = {
  title: "ByteVoice Bangla · মাশরাফি’স ডেন্টাল",
  description: "বাংলায় কথা বলে ডেমো অ্যাপয়েন্টমেন্ট নিন। Try the Bangla voice receptionist for Mashrafi’s Dental.",
};

export default function Home() {
  return <Landing />;
}
