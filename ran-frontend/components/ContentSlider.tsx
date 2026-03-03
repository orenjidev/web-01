"use client";

import ImageSlider from "./imageslider";
import { usePublicConfig } from "@/context/PublicConfigContext";

const FALLBACK = [
  { src: "/images/slider/slide_1.jpeg", caption: "Chapter 18: Paragon" },
  { src: "/images/slider/slide_2.jpeg", caption: "Chapter 19: Revelation" },
];

export default function ContentSlider() {
  const { config } = usePublicConfig();
  const slides = (config?.sliderConfig?.contentSlides ?? []).filter((s) => s.enabled !== false);
  return (
    <ImageSlider
      slides={slides.length > 0 ? slides : FALLBACK}
      height="h-[300px]"
      autoPlay
      interval={3000}
      rounded="rounded-xl"
    />
  );
}
