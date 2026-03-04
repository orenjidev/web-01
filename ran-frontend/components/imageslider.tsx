"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = {
  src: string;
  caption?: string;
  link?: string;
};

type ImageSliderProps = {
  slides: Slide[];
  height?: string;
  autoPlay?: boolean;
  interval?: number;
  rounded?: string;
  shownavibtn?: boolean;
};

export default function ImageSlider({
  slides,
  height = "h-[400px]",
  autoPlay = false,
  interval = 5000,
  rounded = "",
  shownavibtn = false,
}: ImageSliderProps) {
  const [current, setCurrent] = useState(0);

  if (!slides || slides.length === 0) return null;

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);

  const prev = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  // ✅ Proper autoplay using useEffect
  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, slides.length]);

  return (
    <div
      className={`relative w-full ${height} overflow-hidden border ${rounded}`}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 overflow-hidden ${rounded} ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.link ? (
            <a
              href={slide.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full h-full ${rounded}`}
            >
              <Image
                src={slide.src}
                alt={slide.caption ?? `Slide ${i + 1}`}
                width={1920}
                height={800}
                className={`w-full h-full object-cover ${rounded}`}
                priority={i === 0}
                unoptimized
              />
              {slide.caption && (
                <div className="absolute bottom-6 w-full text-center text-white text-xl font-bold drop-shadow-lg">
                  {slide.caption}
                </div>
              )}
            </a>
          ) : (
            <>
              <Image
                src={slide.src}
                alt={slide.caption ?? `Slide ${i + 1}`}
                width={1920}
                height={800}
                className={`w-full h-full object-cover ${rounded}`}
                priority={i === 0}
                unoptimized
              />
              {slide.caption && (
                <div className="absolute bottom-6 w-full text-center text-white text-xl font-bold drop-shadow-lg">
                  {slide.caption}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <>
          {shownavibtn && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-white text-zinc-700 
            transition-all duration-200 
            hover:bg-white/80 hover:scale-110 
            active:scale-95"
                aria-label="previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-white text-zinc-700 
            transition-all duration-200 
            hover:bg-white/80 hover:scale-110 
            active:scale-95"
                aria-label="next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="absolute bottom-3 w-full flex justify-center space-x-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-6 h-2 rounded-full transition-all ${
                  i === current
                    ? "bg-white scale-105"
                    : "bg-white/20 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
