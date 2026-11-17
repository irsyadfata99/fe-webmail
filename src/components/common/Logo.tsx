interface LogoProps {
  className?: string;
}

// Lambang telur emas Motionegg Studios (file di public/logo-mark.png).
export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <img
      src="/logo-mark.png"
      alt="Motionegg Studios"
      className={`w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
