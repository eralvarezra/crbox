// CRBox Tracking — 4 screens
// Aesthetic: Vercel / Linear / Shopify — light, generous whitespace, restrained color.
// Primary: indigo #4F46E5. Accent: emerald #10B981.

const TRACK = "1Z 999 AA1 0123 4567 84";

// ── Shared atoms ─────────────────────────────────────────────
function Shell({ children, bg = "white" }) {
  return (
    <div style={{
      width: "100%", height: "100%", overflow: "hidden",
      background: bg === "white" ? "#fff" : "#FAFAFA",
      fontFamily: "'Geist', ui-sans-serif, system-ui",
      color: "#0A0A0A", display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      {children}
    </div>
  );
}

function TopBar({ rightSlot }) {
  return (
    <div style={{
      height: 64, flexShrink: 0,
      padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid #EDEDED", background: "rgba(255,255,255,.85)",
      backdropFilter: "blur(8px)", zIndex: 2,
    }}>
      <Logo />
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13.5, color: "#525252", fontWeight: 500 }}>
        {rightSlot ?? (
          <>
            <a style={{ color: "#525252" }}>Ayuda</a>
            <a style={{ color: "#525252" }}>Cómo funciona</a>
            <button style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid #E5E5E5",
              background: "#fff", fontWeight: 500, fontSize: 13, color: "#0A0A0A",
              fontFamily: "inherit", cursor: "pointer",
            }}>Ingresar</button>
          </>
        )}
      </div>
    </div>
  );
}

function Logo({ size = 16 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7, background: "#0A0A0A", position: "relative",
        display: "grid", placeItems: "center",
      }}>
        <div style={{
          position: "absolute", inset: 5, border: "1.5px solid #4F46E5", borderRadius: 3,
        }} />
        <div style={{ position: "absolute", left: "50%", top: 5, bottom: 5, width: 1.5, background: "#4F46E5" }} />
      </div>
      <span style={{ fontWeight: 600, fontSize: size, letterSpacing: "-0.02em", color: "#0A0A0A" }}>CRBox</span>
    </div>
  );
}

function GridBg() {
  return (
    <div aria-hidden style={{
      position: "absolute", inset: 0,
      backgroundImage: `
        radial-gradient(circle at 50% 0%, rgba(79,70,229,0.06), transparent 50%),
        linear-gradient(#F4F4F4 1px, transparent 1px),
        linear-gradient(90deg, #F4F4F4 1px, transparent 1px)
      `,
      backgroundSize: "100% 100%, 56px 56px, 56px 56px",
      maskImage: "radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)",
      WebkitMaskImage: "radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)",
      pointerEvents: "none",
    }} />
  );
}

// ── Screen 1 ─ Landing search ────────────────────────────────
function ScreenSearch() {
  const [v, setV] = React.useState("");
  return (
    <Shell>
      <TopBar />
      <div style={{ flex: 1, position: "relative", display: "grid", placeItems: "center" }}>
        <GridBg />
        <div style={{
          position: "relative", zIndex: 1, width: 560, padding: "0 32px",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        }}>
          {/* eyebrow */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 12px 5px 6px", borderRadius: 999,
            background: "#fff", border: "1px solid #E5E5E5",
            fontSize: 12.5, fontWeight: 500, color: "#404040",
            boxShadow: "0 1px 2px rgba(0,0,0,.04)",
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "2px 8px", borderRadius: 999,
              background: "rgba(16,185,129,.1)", color: "#047857",
              fontSize: 11, fontWeight: 600, letterSpacing: "0.01em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} />
              EN VIVO
            </span>
            <span>Rastreo público · USA → Costa Rica</span>
          </span>

          <h1 style={{
            fontSize: 48, lineHeight: 1.05, letterSpacing: "-0.035em", fontWeight: 600,
            margin: "28px 0 14px", color: "#0A0A0A",
          }}>
            Rastrea tu paquete<br />desde USA.
          </h1>
          <p style={{
            fontSize: 16, color: "#737373", margin: 0, maxWidth: 420, lineHeight: 1.55,
          }}>
            Ingresá tu número de tracking para ver el estado de tu paquete en tiempo real.
          </p>

          {/* Search field */}
          <div style={{
            marginTop: 40, width: "100%", display: "flex", gap: 10,
          }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 10,
              padding: "0 16px", height: 52,
              background: "#fff", border: "1px solid #E5E5E5", borderRadius: 12,
              boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 12px -8px rgba(0,0,0,.08)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={v} onChange={(e) => setV(e.target.value)}
                placeholder="Ej: 1Z999AA10123456784"
                style={{
                  flex: 1, border: 0, outline: 0, background: "transparent",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 14.5, fontWeight: 500,
                  color: "#0A0A0A", letterSpacing: "0.01em",
                }}
              />
              {v && <button onClick={() => setV("")} style={{
                border: 0, background: "transparent", color: "#A3A3A3", cursor: "pointer", padding: 4,
              }}>✕</button>}
            </div>
            <button style={{
              height: 52, padding: "0 24px", borderRadius: 12, border: 0,
              background: "#4F46E5", color: "#fff", fontWeight: 600, fontSize: 14.5,
              fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 1px 0 rgba(255,255,255,.15) inset, 0 4px 14px -4px rgba(79,70,229,.55)",
            }}>
              Rastrear
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>

          {/* Hint */}
          <div style={{
            marginTop: 18, fontSize: 12.5, color: "#737373",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <kbd style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              padding: "2px 7px", borderRadius: 5, background: "#F5F5F5",
              border: "1px solid #E5E5E5", color: "#404040",
            }}>↵</kbd>
            <span>Presioná Enter o usá tu código CRB-XXXXX</span>
          </div>

          {/* Trust strip */}
          <div style={{
            marginTop: 56, display: "flex", gap: 32, alignItems: "center",
            paddingTop: 24, borderTop: "1px solid #EDEDED", width: "100%", justifyContent: "center",
          }}>
            {[
              ["28,400+", "paquetes entregados"],
              ["3–5 días", "Miami → SJO"],
              ["98.7%", "puntualidad"],
            ].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "#0A0A0A",
                }}>{n}</div>
                <div style={{ fontSize: 12, color: "#737373", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Screen 2 ─ Result found (TIMELINE is the hero) ───────────
const STEPS = [
  { key: "received", title: "Recibido en bodega USA", sub: "Miami, FL · 8421 NW 56th St",
    date: "Lun, 19 May · 14:32",
    detail: "Paquete escaneado al ingreso. Foto tomada y peso verificado en 4.2 lb." },
  { key: "transit", title: "En tránsito", sub: "Vuelo CRB-0228 · Miami → SJO",
    date: "Mié, 21 May · 22:10",
    detail: "Tu paquete está volando con destino al Aeropuerto Internacional Juan Santamaría." },
  { key: "customs", title: "En aduana CR", sub: "Aduana Santamaría",
    date: "—",
    detail: "Trámite aduanal. Te notificaremos el monto de impuestos cuando esté liquidado." },
  { key: "ready", title: "Listo para retirar", sub: "Sucursal a confirmar",
    date: "—",
    detail: "Disponible para retiro en sucursal o entrega a domicilio según tu preferencia." },
  { key: "delivered", title: "Entregado", sub: "",
    date: "—",
    detail: "Confirmación con firma o foto al recibir." },
];

function ScreenResult() {
  const currentIndex = 1; // "En tránsito"

  return (
    <Shell bg="muted">
      <TopBar
        rightSlot={
          <>
            <span style={{ color: "#737373", fontSize: 13 }}>Rastreo público</span>
            <button style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid #E5E5E5",
              background: "#fff", fontWeight: 500, fontSize: 13, color: "#0A0A0A",
              fontFamily: "inherit", cursor: "pointer",
            }}>Ingresar</button>
          </>
        }
      />
      <div style={{ flex: 1, padding: "32px 40px 56px", overflow: "auto" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          {/* Back + tracking header */}
          <a style={{
            display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#525252",
            marginBottom: 24, cursor: "pointer",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Nueva búsqueda
          </a>

          {/* Summary card */}
          <div style={{
            background: "#fff", border: "1px solid #EDEDED", borderRadius: 16,
            padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24, flexWrap: "wrap",
          }}>
            <div>
              <div style={{
                fontSize: 11.5, fontWeight: 600, color: "#737373", textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}>Tracking</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 600,
                color: "#0A0A0A", marginTop: 4, letterSpacing: "0.01em",
              }}>{TRACK}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 13, color: "#525252" }}>
                <span><b style={{ color: "#0A0A0A", fontWeight: 600 }}>María González</b></span>
                <span style={{ color: "#D4D4D4" }}>·</span>
                <span>Auriculares Sony WH-1000XM5</span>
                <span style={{ color: "#D4D4D4" }}>·</span>
                <span>4.2 lb</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(79,70,229,.08)", color: "#4F46E5",
                padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 600,
              }}>
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F46E5" }} />
                  <span style={{
                    position: "absolute", inset: -3, border: "1.5px solid #4F46E5", borderRadius: "50%",
                    animation: "ping 2s infinite",
                  }} />
                </span>
                EN TRÁNSITO
              </div>
              <div style={{
                fontSize: 12, color: "#525252",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", padding: "2px 7px",
                  background: "#F5F5F5", border: "1px solid #E5E5E5", borderRadius: 5,
                  fontSize: 11, fontWeight: 500, color: "#404040",
                }}>UPS</span>
                <span>In Transit · 1Z999AA…84</span>
              </div>
              <div style={{ fontSize: 13, color: "#0A0A0A" }}>
                Llega <b style={{ fontWeight: 600 }}>Mar, 28 May</b>
              </div>
            </div>
          </div>

          {/* TIMELINE — protagonist */}
          <div style={{
            marginTop: 28, background: "#fff", border: "1px solid #EDEDED",
            borderRadius: 16, padding: "40px 44px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 36,
            }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Progreso
                </div>
                <h2 style={{
                  fontSize: 24, fontWeight: 600, margin: "6px 0 0",
                  letterSpacing: "-0.02em",
                }}>Paso 2 de 5 · En tránsito a Costa Rica</h2>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#737373",
                background: "#F5F5F5", padding: "6px 10px", borderRadius: 7,
              }}>ETA · 7 días</div>
            </div>

            {/* progress bar */}
            <div style={{
              height: 4, background: "#F0F0F0", borderRadius: 999, overflow: "hidden",
              marginBottom: 40,
            }}>
              <div style={{
                width: "32%", height: "100%",
                background: "linear-gradient(90deg, #10B981 0%, #10B981 70%, #4F46E5 100%)",
                borderRadius: 999,
              }} />
            </div>

            {/* timeline */}
            <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }}>
              {STEPS.map((s, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                const pending = i > currentIndex;
                const last = i === STEPS.length - 1;
                return (
                  <li key={s.key} style={{
                    display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 20,
                    paddingBottom: last ? 0 : 28, position: "relative",
                  }}>
                    {/* line */}
                    {!last && (
                      <div style={{
                        position: "absolute", left: 21, top: 36, bottom: 0, width: 2,
                        background: done ? "#10B981" : (active ? "linear-gradient(180deg, #4F46E5, #E5E5E5)" : "#E5E5E5"),
                        borderRadius: 999,
                      }} />
                    )}
                    {/* node */}
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: done ? "#10B981" : (active ? "#4F46E5" : "#fff"),
                      border: pending ? "1.5px solid #E5E5E5" : "0",
                      display: "grid", placeItems: "center", color: "#fff",
                      boxShadow: active ? "0 0 0 6px rgba(79,70,229,.12), 0 4px 12px -4px rgba(79,70,229,.4)" : "none",
                      position: "relative", zIndex: 1,
                    }}>
                      {done && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                      {active && (
                        <span style={{
                          width: 10, height: 10, borderRadius: "50%", background: "#fff",
                        }} />
                      )}
                      {pending && (
                        <span style={{
                          fontSize: 13, fontWeight: 600, color: "#A3A3A3",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>{i + 1}</span>
                      )}
                    </div>
                    {/* content */}
                    <div>
                      <div style={{
                        fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em",
                        color: pending ? "#A3A3A3" : "#0A0A0A",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        {s.title}
                        {active && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 600, color: "#4F46E5",
                            background: "rgba(79,70,229,.1)", padding: "2px 7px", borderRadius: 5,
                            letterSpacing: "0.04em",
                          }}>EN CURSO</span>
                        )}
                      </div>
                      {s.sub && (
                        <div style={{
                          fontSize: 13, color: pending ? "#A3A3A3" : "#525252", marginTop: 3,
                        }}>{s.sub}</div>
                      )}
                      {(done || active) && (
                        <div style={{
                          fontSize: 13, color: "#737373", marginTop: 8,
                          lineHeight: 1.5, maxWidth: 480,
                        }}>{s.detail}</div>
                      )}
                    </div>
                    {/* date */}
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                      color: pending ? "#D4D4D4" : "#737373", whiteSpace: "nowrap",
                      paddingTop: 14,
                    }}>{s.date}</div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* secondary actions */}
          <div style={{
            marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap",
          }}>
            <button style={{
              padding: "10px 16px", borderRadius: 10, border: "1px solid #E5E5E5",
              background: "#fff", fontSize: 13.5, fontWeight: 500, color: "#0A0A0A",
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              Avisarme por WhatsApp
            </button>
            <button style={{
              padding: "10px 16px", borderRadius: 10, border: "1px solid #E5E5E5",
              background: "#fff", fontSize: 13.5, fontWeight: 500, color: "#0A0A0A",
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Compartir
            </button>
            <button style={{
              padding: "10px 16px", borderRadius: 10, border: "1px solid #E5E5E5",
              background: "#fff", fontSize: 13.5, fontWeight: 500, color: "#525252",
              cursor: "pointer", fontFamily: "inherit", marginLeft: "auto",
            }}>¿Algo está mal?</button>
          </div>
        </div>
      </div>

      <style>{`@keyframes ping{0%{transform:scale(.7);opacity:.9}80%,100%{transform:scale(2.2);opacity:0}}`}</style>
    </Shell>
  );
}

// ── Screen 3 ─ Not found ─────────────────────────────────────
function ScreenNotFound() {
  return (
    <Shell>
      <TopBar />
      <div style={{ flex: 1, position: "relative", display: "grid", placeItems: "center" }}>
        <GridBg />
        <div style={{
          position: "relative", zIndex: 1, width: 520, padding: "0 32px", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          {/* Empty illustration — open box with floating ? */}
          <div style={{ position: "relative", width: 160, height: 140, marginBottom: 24 }}>
            <svg width="160" height="140" viewBox="0 0 160 140" fill="none">
              {/* back face */}
              <path d="M30 50 L80 30 L130 50 L80 70 Z" fill="#F5F5F5" stroke="#D4D4D4" strokeWidth="1.5" strokeLinejoin="round"/>
              {/* left face */}
              <path d="M30 50 L30 100 L80 120 L80 70 Z" fill="#EDEDED" stroke="#D4D4D4" strokeWidth="1.5" strokeLinejoin="round"/>
              {/* right face */}
              <path d="M130 50 L130 100 L80 120 L80 70 Z" fill="#FAFAFA" stroke="#D4D4D4" strokeWidth="1.5" strokeLinejoin="round"/>
              {/* tape */}
              <path d="M55 40 L105 60 L130 50" stroke="#A3A3A3" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round"/>
              {/* question mark floating */}
              <g transform="translate(80 18)">
                <circle r="14" fill="#fff" stroke="#4F46E5" strokeWidth="1.5"/>
                <text x="0" y="5" textAnchor="middle" fontFamily="'Geist'" fontSize="16" fontWeight="700" fill="#4F46E5">?</text>
              </g>
              {/* search lines */}
              <line x1="22" y1="38" x2="14" y2="34" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="138" y1="38" x2="146" y2="34" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="80" y1="130" x2="80" y2="136" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", margin: 0, color: "#0A0A0A",
          }}>
            No encontramos ese paquete
          </h1>
          <p style={{
            fontSize: 15, color: "#737373", marginTop: 12, lineHeight: 1.55, maxWidth: 400,
          }}>
            El tracking <code style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              background: "#F5F5F5", padding: "2px 7px", borderRadius: 5,
              color: "#404040", border: "1px solid #E5E5E5",
            }}>1Z999AA10123456784</code> aún no está en nuestro sistema. Puede que el vendedor todavía no lo haya despachado, o que debas registrarlo.
          </p>

          {/* Actions */}
          <div style={{ marginTop: 32, display: "flex", gap: 10 }}>
            <button style={{
              height: 44, padding: "0 20px", borderRadius: 10, border: 0,
              background: "#4F46E5", color: "#fff", fontWeight: 600, fontSize: 14,
              fontFamily: "inherit", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 1px 0 rgba(255,255,255,.15) inset, 0 4px 14px -4px rgba(79,70,229,.5)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Registrar mi paquete
            </button>
            <button style={{
              height: 44, padding: "0 20px", borderRadius: 10,
              background: "#fff", border: "1px solid #E5E5E5",
              color: "#0A0A0A", fontWeight: 500, fontSize: 14,
              fontFamily: "inherit", cursor: "pointer",
            }}>Intentar de nuevo</button>
          </div>

          {/* Helper card */}
          <div style={{
            marginTop: 40, padding: "16px 20px", background: "#FAFAFA",
            border: "1px solid #EDEDED", borderRadius: 12,
            display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left",
            width: "100%",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: "rgba(16,185,129,.12)",
              color: "#047857", display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style={{ fontSize: 13, color: "#525252", lineHeight: 1.5 }}>
              <b style={{ color: "#0A0A0A", fontWeight: 600 }}>¿Es la primera vez que enviás con CRBox?</b><br />
              Cuando registrás tu paquete, un agente lo verifica y queda disponible para rastreo en menos de 24h.
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Screen 4 ─ Pending review ────────────────────────────────
function ScreenPending() {
  return (
    <Shell>
      <TopBar />
      <div style={{ flex: 1, position: "relative", display: "grid", placeItems: "center" }}>
        <GridBg />
        <div style={{
          position: "relative", zIndex: 1, width: 540, padding: "0 32px",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        }}>
          {/* Animated clock */}
          <div style={{ position: "relative", width: 88, height: 88, marginBottom: 24 }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(79,70,229,.1)",
              animation: "pulseBg 2.4s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 10, borderRadius: "50%",
              background: "rgba(79,70,229,.18)",
              animation: "pulseBg 2.4s ease-in-out .3s infinite",
            }} />
            <div style={{
              position: "absolute", inset: 20, borderRadius: "50%",
              background: "#4F46E5", color: "#fff",
              display: "grid", placeItems: "center",
              boxShadow: "0 8px 20px -6px rgba(79,70,229,.5)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
            </div>
          </div>

          {/* Status pill */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 11px", borderRadius: 999,
            background: "rgba(79,70,229,.08)", color: "#4F46E5",
            fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em",
            marginBottom: 18,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F46E5" }} />
            EN REVISIÓN
          </span>

          <h1 style={{
            fontSize: 30, fontWeight: 600, letterSpacing: "-0.025em", margin: 0,
            color: "#0A0A0A", lineHeight: 1.15,
          }}>
            Tu solicitud está en revisión
          </h1>
          <p style={{
            fontSize: 15, color: "#737373", marginTop: 12, lineHeight: 1.55, maxWidth: 420,
          }}>
            Un agente está verificando tu paquete en bodega. Cuando esté aprobado, podrás rastrearlo desde acá.
          </p>

          {/* Tracking ref card */}
          <div style={{
            marginTop: 28, width: "100%", padding: "16px 20px",
            background: "#fff", border: "1px solid #EDEDED", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            textAlign: "left",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Solicitud
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600,
                color: "#0A0A0A", marginTop: 3,
              }}>CRB-REQ-29481</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Respuesta en
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A", marginTop: 3 }}>
                ~ 24–48 h
              </div>
            </div>
          </div>

          {/* Mini timeline of next steps */}
          <div style={{
            marginTop: 16, width: "100%", padding: "20px 22px",
            background: "#FAFAFA", border: "1px solid #EDEDED", borderRadius: 12,
            textAlign: "left",
          }}>
            <div style={{
              fontSize: 11.5, fontWeight: 600, color: "#737373", textTransform: "uppercase",
              letterSpacing: "0.12em", marginBottom: 14,
            }}>Próximos pasos</div>

            {[
              { state: "done", title: "Solicitud recibida", sub: "Hoy · 09:14" },
              { state: "active", title: "Verificación en bodega Miami", sub: "En curso" },
              { state: "pending", title: "Tracking activado", sub: "Te avisamos por correo y WhatsApp" },
            ].map((s, i, arr) => (
              <div key={s.title} style={{
                display: "grid", gridTemplateColumns: "24px 1fr auto", gap: 14, alignItems: "flex-start",
                paddingBottom: i === arr.length - 1 ? 0 : 14, position: "relative",
              }}>
                {i !== arr.length - 1 && (
                  <div style={{
                    position: "absolute", left: 11, top: 24, bottom: 0, width: 2,
                    background: s.state === "done" ? "#10B981" : "#E5E5E5",
                  }} />
                )}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: s.state === "done" ? "#10B981" : (s.state === "active" ? "#4F46E5" : "#fff"),
                  border: s.state === "pending" ? "1.5px solid #E5E5E5" : "0",
                  display: "grid", placeItems: "center", color: "#fff",
                  boxShadow: s.state === "active" ? "0 0 0 4px rgba(79,70,229,.12)" : "none",
                  position: "relative", zIndex: 1,
                }}>
                  {s.state === "done" && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  {s.state === "active" && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
                  )}
                </div>
                <div>
                  <div style={{
                    fontSize: 13.5, fontWeight: 600,
                    color: s.state === "pending" ? "#A3A3A3" : "#0A0A0A",
                  }}>{s.title}</div>
                  <div style={{
                    fontSize: 12, color: s.state === "pending" ? "#A3A3A3" : "#737373", marginTop: 2,
                  }}>{s.sub}</div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: s.state === "active" ? "#4F46E5" : "transparent",
                  background: s.state === "active" ? "rgba(79,70,229,.1)" : "transparent",
                  padding: s.state === "active" ? "3px 8px" : "0",
                  borderRadius: 5, letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}>
                  {s.state === "active" ? "AHORA" : ""}
                </div>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
            <button style={{
              height: 42, padding: "0 18px", borderRadius: 10,
              background: "#fff", border: "1px solid #E5E5E5",
              color: "#0A0A0A", fontWeight: 500, fontSize: 13.5,
              fontFamily: "inherit", cursor: "pointer",
            }}>Volver al inicio</button>
            <button style={{
              height: 42, padding: "0 18px", borderRadius: 10, border: 0,
              background: "#0A0A0A", color: "#fff", fontWeight: 500, fontSize: 13.5,
              fontFamily: "inherit", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              Avisarme por WhatsApp
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulseBg{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.1);opacity:.3}}`}</style>
    </Shell>
  );
}

// ── Canvas ───────────────────────────────────────────────────
function App() {
  const W = 1280, H = 880;
  return (
    <DesignCanvas title="CRBox · Tracking público" subtitle="4 pantallas — Indigo #4F46E5 / Geist · Vercel-style">
      <DCSection id="flow" title="Tracking público" subtitle="Flujo principal del cliente: buscar → ver estado">
        <DCArtboard id="search" label="01 · Búsqueda" width={W} height={H}>
          <ScreenSearch />
        </DCArtboard>
        <DCArtboard id="result" label="02 · Paquete encontrado" width={W} height={H}>
          <ScreenResult />
        </DCArtboard>
        <DCArtboard id="notfound" label="03 · No encontrado" width={W} height={H}>
          <ScreenNotFound />
        </DCArtboard>
        <DCArtboard id="pending" label="04 · Solicitud en revisión" width={W} height={H}>
          <ScreenPending />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
