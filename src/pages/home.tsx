import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  // Estados para animación del cometa y la estela
  const [progress, setProgress] = useState(0);
  const [tail, setTail] = useState(0);
  const [showX, setShowX] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showSlogan, setShowSlogan] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Path del arco
  const pathRef = useRef<SVGPathElement>(null);

  // Animación del cometa y la estela
  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1800;
    const tailDuration = 700;

    function animateComet(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const prog = Math.min(elapsed / duration, 1);
      setProgress(prog);
      setTail(prog);

      if (prog < 1) {
        frame = requestAnimationFrame(animateComet);
      } else {
        let tailStart: number | null = null;
        function animateTail(tailTs: number) {
          if (!tailStart) tailStart = tailTs;
          const tailElapsed = tailTs - tailStart;
          const tailProg = Math.max(1 - tailElapsed / tailDuration, 0);
          setTail(tailProg);
          if (tailProg > 0) {
            frame = requestAnimationFrame(animateTail);
          } else {
            setShowX(true);
          }
        }
        requestAnimationFrame(animateTail);
      }
    }
    frame = requestAnimationFrame(animateComet);

    const logoTimeout = setTimeout(() => setShowLogo(true), 2200);
    const sloganTimeout = setTimeout(() => setShowSlogan(true), 2600);
    const buttonTimeout = setTimeout(() => setShowButton(true), 3200);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(logoTimeout);
      clearTimeout(sloganTimeout);
      clearTimeout(buttonTimeout);
    };
  }, []);

  function getPointAt(progress: number) {
    const path = pathRef.current;
    if (!path) return { x: 0, y: 0 };
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * progress);
    return { x: point.x, y: point.y };
  }

  const arcPath = "M0,65 Q85,-60 180,80";
  const arcLength = 314;
  const cometPos = getPointAt(progress);

  // Espaciado vertical entre bloques principales
  const spacing = 40;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at center, #1b2330 0%, #0a0c16 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>
        {`
          @font-face {
            font-family: 'AmbiguityInline';
            src: url('/assets/fonts/AmbiguityInline.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          .wolfx-font {
            font-family: 'AmbiguityInline', sans-serif;
            letter-spacing: 0.1em;
            color: #00ffe7;
            text-shadow:
              0 0 8px #00ffe7,
              0 0 16px #00ffe7,
              0 0 32px #00ffe7;
          }
          .neon-x {
            color: #00ffe7;
            text-shadow:
              0 0 8px #00ffe7,
              0 0 16px #00ffe7,
              0 0 32px #00ffe7;
            font-family: 'AmbiguityInline', sans-serif;
            font-weight: bold;
            transition: opacity 0.5s, transform 0.5s;
          }
        `}
      </style>
      <div
        className="backdrop-blur-lg bg-white/10 rounded-3xl shadow-2xl p-16 flex flex-col items-center animate-fade-in max-w-2xl w-full relative"
        style={{
          minHeight: "520px",
          height: "680px",
          transition: "height 0.5s",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: "130px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: `${spacing}px`,
          }}
        >
          {showLogo && (
            <img
              src="/wolf-x-imagenes/Logo-wolfx.png"
              alt="WOLF X Logo"
              className="h-32 w-32 rounded-full shadow-lg border-4 border-transparent"
              style={{
                boxShadow: "0 0 40px 0 #00ffe7, 0 0 0 8px rgba(255,255,255,0.2)",
                transition: "opacity 0.7s, transform 0.7s",
                opacity: showLogo ? 1 : 0,
                transform: showLogo ? "translateY(0)" : "translateY(-20px)",
              }}
            />
          )}
        </div>

        {/* Efecto Disney+: WOLF + arco + X */}
        <div
          className="relative flex flex-row items-center justify-center"
          style={{
            height: "140px",
            marginBottom: `${spacing}px`,
            width: "100%",
          }}
        >
          {/* SVG arco animado con cometa y estela */}
          <svg
            width="450"
            height="130"
            viewBox="0 0 270 90"
            className="absolute left-1/2"
            style={{
              transform: "translateX(-50%)",
              top: "-30px",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {/* Estela */}
            <path
              ref={pathRef}
              d={arcPath}
              stroke="url(#tail-gradient)"
              strokeWidth="8"
              fill="none"
              style={{
                strokeDasharray: arcLength,
                strokeDashoffset: arcLength * (1 - progress) + arcLength * (1 - tail),
                opacity: tail > 0 ? 1 : 0,
                filter: "drop-shadow(0 0 24px #fff) drop-shadow(0 0 32px #ffe066) drop-shadow(0 0 16px #00ffe7)",
                transition: "opacity 0.2s",
              }}
            />
            {/* Gradiente para la estela */}
            <defs>
              <linearGradient id="tail-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fffbe7" stopOpacity="1" />
                <stop offset="30%" stopColor="#ffe066" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#00ffe7" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="comet-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fffbe7" stopOpacity="1" />
                <stop offset="60%" stopColor="#ffe066" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#00ffe7" stopOpacity="0.8" />
              </radialGradient>
            </defs>
            {/* Cometa (punto de luz) */}
            {progress < 1 && (
              <circle
                cx={cometPos.x}
                cy={cometPos.y}
                r="13"
                fill="url(#comet-gradient)"
                style={{
                  filter: "drop-shadow(0 0 32px #fffbe7) drop-shadow(0 0 48px #ffe066) drop-shadow(0 0 64px #00ffe7)",
                  opacity: 1,
                  transition: "opacity 0.2s",
                }}
              />
            )}
          </svg>
          {/* Texto WOLF X alineado horizontalmente */}
          <span className="wolfx-font text-6xl font-extrabold tracking-tight drop-shadow-lg select-none text-center">
            WOLF
          </span>
          <span
            className="neon-x text-6xl font-extrabold tracking-tight drop-shadow-lg select-none"
            style={{
              marginLeft: "18px",
              opacity: showX ? 1 : 0,
              transform: showX ? "scale(1)" : "scale(0.7)",
              transition: "opacity 0.5s 0.1s, transform 0.5s 0.1s",
            }}
          >
            X
          </span>
        </div>

        {/* Slogan: el contenedor siempre está, pero invisible hasta showSlogan */}
        <div
          style={{
            minHeight: "72px", // ajusta según el alto real de tu slogan
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            opacity: showSlogan ? 1 : 0,
            pointerEvents: showSlogan ? "auto" : "none",
            transition: "opacity 0.7s, transform 0.7s",
            transform: showSlogan ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <p
            className="text-2xl text-white mb-10 text-center max-w-xl font-medium"
            style={{
              width: "100%",
              textShadow: "0 0 8px #00ffe7, 0 0 16px #00ffe7",
            }}
          >
            Soluciones Integrales en gestión<br />
            Software multiempresa, multisucursal - OnLine.
          </p>
        </div>

        {/* Botón: el contenedor siempre está, pero invisible hasta showButton */}
        <div
          style={{
            minHeight: "80px", // ajusta según el alto real del botón
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            opacity: showButton ? 1 : 0,
            pointerEvents: showButton ? "auto" : "none",
            transition: "opacity 0.5s, transform 0.5s",
            transform: showButton ? "scale(1)" : "scale(0.7)",
          }}
        >
          <button
            onClick={() => navigate("/login")}
            className="px-16 py-6 rounded-full bg-transparent text-white font-bold text-2xl shadow-2xl border-4"
            style={{
              borderColor: "#00ffe7",
              color: "#00ffe7",
              letterSpacing: "0.08em",
              boxShadow: "0 0 16px #00ffe7, 0 0 32px #00ffe7",
              width: "100%",
              maxWidth: "340px",
            }}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
      {/* Footer fuera del contenedor principal, usando toda la página */}
      <footer className="w-full flex justify-center items-center py-2 absolute left-0 bottom-0 text-white/60 text-3x">
        &copy; {new Date().getFullYear()} WOLF X Soluciones Integrales. Todos los derechos reservados.
      </footer>
    </div>
  );
}