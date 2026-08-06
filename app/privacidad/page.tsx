import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad · Guárdamela",
};

// Fecha de última actualización — actualizar al modificar el texto.
const ACTUALIZADO = "31 de julio de 2026";

export default function PrivacidadPage() {
  return (
    <article className="legal">
      <div className="legal__aviso">
        <strong>Borrador.</strong> Este texto describe el funcionamiento real de
        la app, pero los datos marcados con <code>[COMPLETAR]</code> deben
        rellenarse y todo el documento debe revisarse con asesoría legal antes de
        publicarse.
      </div>

      <h1>Política de privacidad</h1>
      <p className="legal__fecha">Última actualización: {ACTUALIZADO}</p>

      <p>
        Esta política explica qué datos recopila Guárdamela (“la Aplicación”),
        con qué fin y cómo se tratan. El responsable del tratamiento es{" "}
        <strong>[COMPLETAR: razón social / titular]</strong>, con domicilio en{" "}
        <strong>[COMPLETAR: domicilio]</strong> y contacto{" "}
        <strong>[COMPLETAR: email de contacto]</strong>.
      </p>

      <h2>1. Qué datos recopilamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> al registrarte con email o con Google,
          guardamos tu dirección de correo y un identificador de usuario. Las
          contraseñas las gestiona nuestro proveedor de autenticación (Supabase);
          nosotros no las almacenamos ni las vemos.
        </li>
        <li>
          <strong>Ficha de empresa</strong> (si sos empresa): nombre, categoría,
          teléfono, email, dirección, horario, sitio web, Instagram e imagen de
          la tarjeta que cargues. Estos datos son <em>públicos</em> por su
          naturaleza: se muestran en tu ficha y en el feed.
        </li>
        <li>
          <strong>Actividad:</strong> las empresas que guardás, las
          puntuaciones (1 a 5) que dejás y las notas privadas que escribís sobre
          empresas guardadas. Las notas privadas sólo las ves vos.
        </li>
        <li>
          <strong>Datos técnicos:</strong> datos mínimos de funcionamiento y
          seguridad que generan nuestros proveedores (p. ej. registros de acceso
          y verificación anti-bots). <strong>[COMPLETAR: analítica, si se usa
          alguna herramienta de medición.]</strong>
        </li>
      </ul>

      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Prestar el servicio: crear tu cuenta, mostrar y guardar fichas.</li>
        <li>Mostrar puntuaciones promedio y tus notas privadas.</li>
        <li>Proteger la cuenta y prevenir abuso (verificación anti-bots).</li>
        <li>Cumplir obligaciones legales que correspondan.</li>
      </ul>
      <p>
        No vendemos tus datos personales ni los usamos para publicidad de
        terceros.
      </p>

      <h2>3. Con quién los compartimos</h2>
      <p>
        Nos apoyamos en proveedores que procesan datos por nuestra cuenta:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — autenticación, base de datos y
          almacenamiento de imágenes.
        </li>
        <li>
          <strong>Cloudflare Turnstile</strong> — verificación anti-bots en el
          acceso.
        </li>
        <li>
          <strong>Google</strong> — si iniciás sesión con tu cuenta de Google.
        </li>
        <li>
          <strong>[COMPLETAR: proveedor de hosting/deploy, p. ej. Vercel]</strong>.
        </li>
      </ul>

      <h2>4. Guardados sin cuenta</h2>
      <p>
        Si usás la Aplicación sin registrarte, las empresas que guardás se
        almacenan sólo en tu dispositivo (almacenamiento local del navegador).
        Al registrarte, esos guardados se migran a tu cuenta y se borran del
        dispositivo.
      </p>

      <h2>5. Cuánto tiempo los conservamos</h2>
      <p>
        Mientras tu cuenta esté activa. Si la eliminás, se borran tus datos
        asociados, salvo lo que debamos conservar por obligación legal.{" "}
        <strong>[COMPLETAR: plazos concretos, si aplican.]</strong>
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Podés acceder, rectificar o eliminar tus datos, y oponerte a ciertos
        tratamientos, escribiendo a{" "}
        <strong>[COMPLETAR: email de contacto]</strong>. Según tu país, podés
        reclamar ante la autoridad de protección de datos que corresponda.{" "}
        <strong>[COMPLETAR: jurisdicción y autoridad competente.]</strong>
      </p>

      <h2>7. Menores</h2>
      <p>
        La Aplicación no está dirigida a menores de{" "}
        <strong>[COMPLETAR: edad según jurisdicción]</strong>. No recopilamos
        datos de menores de forma consciente.
      </p>

      <h2>8. Cambios</h2>
      <p>
        Podemos actualizar esta política. Publicaremos la nueva versión con su
        fecha de actualización.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Dudas sobre privacidad:{" "}
        <strong>[COMPLETAR: email de contacto]</strong>.
      </p>
    </article>
  );
}
