
const fireworks = [
  { x: "12%", y: "45%", delay: "0s", color: "#FF6B53" },
  { x: "30%", y: "55%", delay: "1.4s", color: "#20B6A4" },
  { x: "52%", y: "35%", delay: "2.8s", color: "#FFB65C" },
  { x: "75%", y: "60%", delay: "1.8s", color: "#FF6B53" },
  { x: "90%", y: "40%", delay: "3.5s", color: "#20B6A4" },
];

export function NavbarFireworks() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {fireworks.map((firework, index) => (
        <span
          key={index}
          className="eventgo-firework"
          style={{
            left: firework.x,
            top: firework.y,
            color: firework.color,
            animationDelay: firework.delay,
          }}
        >
          {Array.from({ length: 10 }, (_, ray) => (
            <span
              key={ray}
              className="eventgo-firework-ray"
              style={{
                transform: `rotate(${ray * 36}deg)`,
              }}
            />
          ))}
        </span>
      ))}
    </div>
  );
}
