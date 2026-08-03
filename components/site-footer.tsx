import Link from "next/link";

const ANIO = new Date().getFullYear();

/**
 * Footer del sitio: qué es Guárdamela, accesos rápidos y enlaces legales.
 * Los datos de contacto/empresa quedan como [COMPLETAR] hasta que se definan.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__col site-footer__col--marca">
          <span className="site-footer__marca">Guárdamela</span>
          <p className="site-footer__lema">
            Tarjetas de contacto por QR. Escaneá, guardá, no las pierdas más.
          </p>
        </div>

        <nav className="site-footer__col" aria-label="Navegación">
          <span className="site-footer__titulo">Explorar</span>
          <Link href="/">Feed</Link>
          <Link href="/guardados">Servicios guardados</Link>
          <Link href="/login?role=empresa">Publicá tu ficha</Link>
        </nav>

        <nav className="site-footer__col" aria-label="Legal">
          <span className="site-footer__titulo">Legal</span>
          <Link href="/privacidad">Política de privacidad</Link>
          <Link href="/terminos">Términos y condiciones</Link>
        </nav>

        <div className="site-footer__col" aria-label="Contacto">
          <span className="site-footer__titulo">Contacto</span>
          {/* COMPLETAR: email real de contacto. */}
          <a href="mailto:[COMPLETAR: email de contacto]">
            [COMPLETAR: email]
          </a>
          {/* COMPLETAR: redes reales, si las hay. */}
          <span className="site-footer__nota">[COMPLETAR: redes sociales]</span>
        </div>
      </div>

      <div className="site-footer__base">
        <span>© {ANIO} Guárdamela. Todos los derechos reservados.</span>
        <span className="site-footer__nota">
          Hecho con Next.js y Supabase.
        </span>
      </div>
    </footer>
  );
}
