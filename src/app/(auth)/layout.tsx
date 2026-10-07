import React from "react";

export default function AuthLayoutGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative min-h-screen w-full text-foreground font-sans overflow-hidden flex bg-black">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-[25%_center] md:object-center scale-[1.15] pointer-events-none"
      >
        <source src="/assets/forge-login.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 grid w-full min-h-screen grid-cols-1 md:grid-cols-12">
        {/* LEFT 55%: Transparent to show the video */}
        <div className="hidden md:block md:col-span-6 lg:col-span-7" />

        {/* RIGHT 45%: Auth Form container */}
        <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-center min-h-screen p-6 lg:p-14 bg-black/60 md:bg-transparent backdrop-blur-md md:backdrop-blur-none">
          <div className="w-full max-w-md mx-auto space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
