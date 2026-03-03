"use client";

import ImageSlider from "./imageslider";
import { usePublicConfig } from "@/context/PublicConfigContext";

const FALLBACK = [{ src: "/images/slider/slide_1.jpeg", caption: "Chapter 18: Paragon" }];

export default function BannerSlider() {
  const { config } = usePublicConfig();
  const slides = (config?.sliderConfig?.bannerSlides ?? []).filter((s) => s.enabled !== false);
  return (
    <ImageSlider
      slides={slides.length > 0 ? slides : FALLBACK}
      height="h-[500px]"
      autoPlay
      interval={3000}
      rounded="rounded-xl"
    />
  );
}
