import { useCallback, useMemo, useState, useEffect } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

const ParticleBackground = () => {
  const [init, setInit] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmall, setIsVerySmall] = useState(false);

  // Initialize particles engine
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    }).catch((e) => {
      console.error("Failed to init particles:", e);
      // We can just leave init as false, and it will render nothing (transparent background) or fallback
      // The component handles !init by returning null, which is fine as valid safe degradation.
    });
  }, []);

  // Detect screen size and update particle count
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsVerySmall(width < 400);
      setIsMobile(width < 768);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Memoize particle options to avoid re-rendering
  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: {
        enable: false,
        zIndex: -1
      },
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 3,
          },
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: ["#05d9e8", "#ff2a6d"],
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: true,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            width: 1920,
            height: 1080,
          },
          value: isMobile ? 30 : 60,
        },
        opacity: {
          value: {
            min: 0.4,
            max: 0.7,
          },
          animation: {
            enable: true,
            speed: 0.5,
            sync: false,
          },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: {
            min: 2,
            max: 4,
          },
        },
      },
      detectRetina: true,
    }),
    [isMobile]
  );

  const particlesLoaded = useCallback(async () => {
    // Callback when particles are loaded (optional)
  }, []);

  // If device is very small, show solid gradient background instead
  if (isVerySmall) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%)",
          zIndex: -1,
        }}
      />
    );
  }

  // Don't render until particles engine is initialized, show static background as fallback
  if (!init) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%)",
          zIndex: -1,
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none", // Ensure particles don't block clicks
      }}
    >
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
        className="w-full h-full"
      />
    </div>
  );
};

export default ParticleBackground;
