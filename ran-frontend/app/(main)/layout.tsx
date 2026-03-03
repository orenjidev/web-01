import MaxWidthWrapper from "@/components/maxwidthwrapper";
import ImageSlider from "@/components/imageslider";
import NavBar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { ServerInfoSection } from "@/components/serverinfo";
import DownloadSection from "@/components/download";
import RankingSection from "@/components/ranking";
import AccountSummary from "@/components/AccountSection";
import AuthSwitchPanel from "@/components/auth/AuthSwitchPanel";
import ModalManager from "@/components/auth/ModalManager";
// import Ranking from "@/components/ranking-card/ranking";
// import { Toaster } from "@/components/ui/sonner";
// import DownloadBar from "@/components/downloadbar";
// import { ServerInfo } from "@/components/serverinfo";
import Footer from "@/components/footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <ModalManager />
      {/* IMAGE SLIDER */}
      <div className="-mt-24">
        <ImageSlider
          slides={[
            {
              src: "/images/slider/slide_1.jpeg",
              caption: "Chapter 18: Paragon",
            },
          ]}
          height="h-[500px]"
          autoPlay
          interval={3000}
          rounded="rounded-xl"
        />
        <div className="mx-auto bg-background border-b border-black/20 pt-4 mb-2">
          <DownloadSection />
        </div>
        <MaxWidthWrapper>
          <div className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3">
                <AuthSwitchPanel />
                <RankingSection />
              </div>

              <div className="md:col-span-6 space-y-4">
                <ImageSlider
                  slides={[
                    {
                      src: "/images/slider/slide_1.jpeg",
                      caption: "Chapter 18: Paragon",
                    },
                    {
                      src: "/images/slider/slide_2.jpeg",
                      caption: "Chapter 19: Revelation",
                    },
                  ]}
                  height="h-[300px]"
                  autoPlay
                  interval={3000}
                  rounded="rounded-xl"
                />
                {children}
              </div>

              <div className="md:col-span-3">
                <ServerInfoSection />
              </div>
            </div>

            <Toaster />
          </div>
        </MaxWidthWrapper>
        <Footer />
      </div>
    </>
  );
}
