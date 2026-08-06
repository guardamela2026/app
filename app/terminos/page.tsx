import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones · Guárdamela",
};

const ACTUALIZADO = "31 de julio de 2026";

export default function TerminosPage() {
  return (
    <article className="legal">
      <div className="legal__aviso">
        <strong>Borrador.</strong> Texto ajustado a lo que hace la app. Los
        datos marcados con <code>[COMPLETAR]</code> deben rellenarse y todo el
        documento debe revisarse con asesoría legal antes de publicarse.
      </div>

      <h1>Términos y condiciones</h1>
      <p className="legal__fecha">Última actualización: {ACTUALIZADO}</p>

      <p>
        Estos términos regulan el uso de Guárdamela (“la Aplicación”), operada
        por <strong>[COMPLETAR: razón social / titular]</strong> (“nosotros”).
        Al usar la Aplicación, aceptás estos términos. Si no estás de acuerdo, no
        la uses.
      </p>

      <h2>1. Qué es la Aplicación</h2>
      <p>
        Guárdamela permite a las empresas publicar una ficha de contacto con un
        código QR, y a las personas escanear, guardar y puntuar esas fichas. El
        servicio se ofrece “tal cual”, y podemos modificarlo o discontinuarlo.
      </p>

      <h2>2. Cuentas</h2>
      <ul>
        <li>
          Sos responsable de la actividad de tu cuenta y de mantener segura tu
          contraseña.
        </li>
        <li>
          Debés brindar información veraz. Podemos suspender cuentas con datos
          falsos o usos que violen estos términos.
        </li>
        <li>
          Debés tener la edad mínima legal en tu país para usar la Aplicación.
        </li>
      </ul>

      <h2>3. Contenido que publicás</h2>
      <ul>
        <li>
          Si sos empresa, sos responsable de los datos e imágenes de tu ficha, y
          declarás tener derecho a usarlos. La ficha y sus datos son públicos.
        </li>
        <li>
          Las puntuaciones deben reflejar una experiencia real. Están prohibidas
          las puntuaciones falsas, coordinadas o para perjudicar a terceros.
        </li>
        <li>
          No se permite contenido ilegal, engañoso, ofensivo, que infrinja
          derechos de terceros o que suplante identidad.
        </li>
        <li>
          Podemos retirar contenido o fichas que incumplan estos términos, sin
          aviso previo.
        </li>
      </ul>

      <h2>4. Licencia sobre tu contenido</h2>
      <p>
        Conservás la titularidad de lo que publicás. Nos otorgás una licencia no
        exclusiva para alojar y mostrar ese contenido dentro de la Aplicación con
        el fin de prestar el servicio.
      </p>

      <h2>5. Uso aceptable</h2>
      <p>Al usar la Aplicación te comprometés a no:</p>
      <ul>
        <li>Extraer datos de forma automatizada (scraping) sin autorización.</li>
        <li>Intentar vulnerar la seguridad o el acceso de otras cuentas.</li>
        <li>Usarla para spam, fraude o cualquier fin ilícito.</li>
      </ul>

      <h2>6. Puntuaciones y contenido de terceros</h2>
      <p>
        Las puntuaciones y las fichas las generan los usuarios y las empresas. No
        garantizamos su exactitud ni respaldamos su contenido. Cada empresa es
        responsable de la información de su ficha.
      </p>

      <h2>7. Servicios de terceros</h2>
      <p>
        La Aplicación usa proveedores como Supabase, Cloudflare y Google. Su uso
        puede estar sujeto a los términos de esos terceros.
      </p>

      <h2>8. Disponibilidad y garantías</h2>
      <p>
        La Aplicación se ofrece “tal cual” y “según disponibilidad”, sin
        garantías de que funcione sin interrupciones ni errores. En la máxima
        medida permitida por la ley, no somos responsables por daños indirectos
        derivados del uso o la imposibilidad de uso del servicio.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        <strong>
          [COMPLETAR: límite de responsabilidad según la jurisdicción aplicable.]
        </strong>
      </p>

      <h2>10. Cambios en los términos</h2>
      <p>
        Podemos actualizar estos términos. Los cambios rigen desde su
        publicación con la fecha de actualización. El uso continuado implica su
        aceptación.
      </p>

      <h2>11. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por las leyes de{" "}
        <strong>[COMPLETAR: país / jurisdicción]</strong>, y cualquier
        controversia se somete a los tribunales de{" "}
        <strong>[COMPLETAR: ciudad / jurisdicción]</strong>.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Consultas sobre estos términos:{" "}
        <strong>[COMPLETAR: email de contacto]</strong>.
      </p>
    </article>
  );
}
