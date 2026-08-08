"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Camera,
  MonitorPlay,
  QrCode,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { fadeUp, staggerContainer, tapSoft } from "@/lib/motion";

const WA_LINK =
  "https://wa.me/528110474854?text=" +
  encodeURIComponent("Hola, me interesa Lumina Social para un evento.");

const TEAM_LINKS = [
  {
    href: "/paparazzi",
    label: "Paparazzi",
    detail: "Captura en mesa con cámara y edición",
    icon: Camera,
  },
  {
    href: "/moderator",
    label: "Moderador",
    detail: "Aprueba fotos, trivia y duelos en vivo",
    icon: Sparkles,
  },
  {
    href: "/screen",
    label: "Pantalla",
    detail: "Muestra EN VIVO en la pantalla grande",
    icon: MonitorPlay,
  },
  {
    href: "/guest?code=DEMO",
    label: "Invitado (demo)",
    detail: "Vista de mesa para dinámicas y revista",
    icon: Users,
  },
] as const;

export function LandingHero() {
  const reduce = useReducedMotion();

  return (
    <main className="relative overflow-hidden bg-[#080706] text-[#f4ead7]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -15%, rgba(196,165,116,0.2), transparent 58%), radial-gradient(ellipse 45% 40% at 100% 70%, rgba(120,90,50,0.14), transparent 55%), linear-gradient(180deg, #0c0b0a 0%, #080706 45%, #0a0908 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,234,215,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(244,234,215,0.4) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 75% 55% at 50% 30%, black, transparent)",
        }}
      />

      {/* Hero — first viewport */}
      <section className="relative z-10 flex min-h-dvh flex-col">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
          <p className="font-display text-2xl tracking-tight text-[#f8f0e3] sm:text-3xl">
            Lumina Social
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-[0.2em] text-[#c4a574] transition hover:text-[#D4AF37]"
          >
            WhatsApp
          </a>
        </header>

        <motion.div
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={staggerContainer}
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-20 pt-6"
        >
          <motion.p
            variants={fadeUp}
            className="font-display text-5xl leading-[0.95] tracking-tight text-[#f8f0e3] sm:text-7xl md:text-8xl"
          >
            Lumina Social
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-6 max-w-2xl text-xl font-medium leading-snug text-[#f4ead7]/90 sm:text-2xl"
          >
            Experiencias interactivas para bodas y eventos sociales
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-md text-base leading-relaxed text-[#f4ead7]/55"
          >
            Cada mesa participa con un QR. Fotos, trivia y duelos en tiempo
            real — y un álbum digital para compartir después.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <motion.a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={reduce ? undefined : tapSoft}
              className="group inline-flex min-h-12 items-center gap-2 bg-[#D4AF37] px-7 py-3.5 text-sm font-semibold tracking-wide text-[#1a140c] transition hover:bg-[#e0c15a]"
            >
              Hablar por WhatsApp
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>
            <Link
              href="/guest?code=DEMO"
              className="inline-flex min-h-12 items-center border border-[#D4AF37]/40 px-7 py-3.5 text-sm font-medium tracking-wide text-[#D4AF37] transition hover:border-[#D4AF37] hover:text-[#f4ead7]"
            >
              Ver demo invitados
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Cómo funciona */}
      <section className="relative z-10 border-t border-[#D4AF37]/15">
        <motion.div
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6 py-20"
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]"
          >
            Cómo funciona
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display mt-3 max-w-xl text-4xl text-[#f8f0e3] sm:text-5xl"
          >
            Tres momentos. Una experiencia memorable.
          </motion.h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "QR en cada mesa",
                body: "Los invitados entran sin apps. La mesa queda asignada al instante.",
                icon: QrCode,
              },
              {
                n: "02",
                title: "Dinámicas en vivo",
                body: "Paparazzi, trivia y duelos impulsan la pantalla y la energía del salón.",
                icon: Sparkles,
              },
              {
                n: "03",
                title: "Álbum al cerrar",
                body: "Al archivar el evento, el cliente recibe una URL del álbum con caducidad.",
                icon: MonitorPlay,
              },
            ].map((step) => (
              <motion.div key={step.n} variants={fadeUp}>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]/70">
                  {step.n}
                </p>
                <step.icon className="mt-4 h-6 w-6 text-[#D4AF37]" />
                <h3 className="font-display mt-3 text-2xl text-[#f8f0e3]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#f4ead7]/50">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Acceso equipo */}
      <section className="relative z-10 border-t border-[#D4AF37]/15 bg-[#0c0b0a]/80">
        <motion.div
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6 py-20"
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]"
          >
            Durante el evento
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display mt-3 text-4xl text-[#f8f0e3] sm:text-5xl"
          >
            Acceso del equipo
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-3 max-w-lg text-sm text-[#f4ead7]/50"
          >
            Herramientas de operación. Los invitados llegan por el QR de su mesa;
            esta sección es para staff y demos.
          </motion.p>

          <motion.ul variants={staggerContainer} className="mt-10 divide-y divide-[#D4AF37]/15">
            {TEAM_LINKS.map((item) => (
              <motion.li key={item.href} variants={fadeUp}>
                <Link
                  href={item.href}
                  className="group flex items-center justify-between gap-4 py-5 transition hover:text-[#f8f0e3]"
                >
                  <span className="flex items-start gap-4">
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
                    <span>
                      <span className="block text-base font-medium text-[#f4ead7] group-hover:text-[#f8f0e3]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-[#f4ead7]/45">
                        {item.detail}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#D4AF37]/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </motion.li>
            ))}
          </motion.ul>

          <motion.p variants={fadeUp} className="mt-8">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#f4ead7]/40 transition hover:text-[#D4AF37]"
            >
              <Shield className="h-3.5 w-3.5" />
              Acceso admin
            </Link>
          </motion.p>
        </motion.div>
      </section>

      {/* Contacto */}
      <section className="relative z-10 border-t border-[#D4AF37]/15">
        <motion.div
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6 py-20"
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]"
          >
            Contacto
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display mt-3 text-4xl text-[#f8f0e3] sm:text-5xl"
          >
            Cotiza tu evento
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg text-[#f4ead7]/65"
          >
            81 1047 4854
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 border border-[#D4AF37] bg-[#D4AF37] px-7 py-3.5 text-sm font-semibold text-[#1a140c] transition hover:bg-[#e0c15a]"
            >
              Abrir WhatsApp
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-[#D4AF37]/10 px-6 py-8 text-center text-[10px] uppercase tracking-[0.25em] text-[#f4ead7]/30">
        Lumina Social
      </footer>
    </main>
  );
}
