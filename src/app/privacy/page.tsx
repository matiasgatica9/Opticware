import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-emerald-700 text-sm font-medium hover:underline">
            ← Volver a OpticWare
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Política de Privacidad</h1>
          <p className="text-sm text-gray-500 mt-1">Última actualización: junio de 2026</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Responsable del tratamiento de datos</h2>
            <p>
              OpticWare (en adelante, "el Servicio") es responsable del tratamiento de los datos personales
              recolectados a través de la plataforma disponible en <strong>opticware.site</strong>.
              El Servicio opera en cumplimiento de la <strong>Ley N° 25.326 de Protección de Datos Personales</strong>
              de la República Argentina y su normativa complementaria.
            </p>
            <p className="mt-2">
              Para consultas relacionadas con sus datos personales, puede comunicarse a:
              <strong> contacto@opticware.site</strong>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Datos que recolectamos</h2>
            <p className="mb-2">Recolectamos los siguientes datos:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Datos del titular de la cuenta:</strong> nombre completo, nombre de la óptica, dirección de email y contraseña (almacenada de forma cifrada).</li>
              <li><strong>Datos de pacientes:</strong> nombre y apellido, DNI, fecha de nacimiento, teléfono, email, domicilio, obra social y notas clínicas. Estos datos son ingresados por el titular de la cuenta (la óptica) y corresponden a sus propios pacientes.</li>
              <li><strong>Datos de uso:</strong> información técnica como dirección IP, tipo de navegador y páginas visitadas dentro del sistema, con fines de seguridad y mejora del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Finalidad del tratamiento</h2>
            <p className="mb-2">Los datos son utilizados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Proveer las funcionalidades del sistema de gestión óptica (pacientes, turnos, ventas, facturación, stock).</li>
              <li>Autenticar usuarios y mantener la seguridad de las cuentas.</li>
              <li>Enviar comunicaciones relacionadas con el servicio (confirmación de cuenta, recuperación de contraseña).</li>
              <li>Mejorar el funcionamiento y la experiencia de uso de la plataforma.</li>
            </ul>
            <p className="mt-2">
              <strong>No utilizamos los datos con fines publicitarios ni los cedemos a terceros.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Responsabilidad sobre datos de pacientes</h2>
            <p>
              Los titulares de cuenta (ópticas) son responsables de haber obtenido el consentimiento de sus pacientes
              para el almacenamiento de sus datos en el sistema, de conformidad con la Ley 25.326.
              OpticWare actúa como encargado del tratamiento en nombre de la óptica y no accede a los datos de los
              pacientes salvo para brindar soporte técnico autorizado expresamente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Almacenamiento y seguridad</h2>
            <p>
              Los datos se almacenan en servidores seguros provistos por <strong>Supabase</strong> (infraestructura sobre
              Amazon Web Services). Se aplican medidas técnicas y organizativas para proteger la información contra
              accesos no autorizados, pérdida o alteración, incluyendo cifrado en tránsito (HTTPS/TLS) y en reposo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Plazo de conservación</h2>
            <p>
              Los datos se conservan mientras la cuenta esté activa. Al dar de baja la cuenta, los datos
              son eliminados dentro de los <strong>30 días hábiles</strong> siguientes a la solicitud,
              salvo obligación legal de conservación.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Derechos del titular</h2>
            <p className="mb-2">
              De acuerdo con la Ley 25.326, el titular de los datos tiene derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Acceder</strong> a sus datos personales almacenados.</li>
              <li><strong>Rectificar</strong> datos inexactos o incompletos.</li>
              <li><strong>Suprimir</strong> sus datos ("derecho al olvido").</li>
              <li><strong>Oponerse</strong> al tratamiento en casos justificados.</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, envíe una solicitud a <strong>contacto@opticware.site</strong> indicando
              su nombre completo y el email asociado a la cuenta.
            </p>
            <p className="mt-2">
              La Dirección Nacional de Protección de Datos Personales (DNPDP) es el organismo de control competente.
              Para más información: <strong>www.argentina.gob.ar/aaip/datospersonales</strong>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Cookies</h2>
            <p>
              OpticWare utiliza cookies de sesión estrictamente necesarias para mantener al usuario autenticado.
              No se utilizan cookies de rastreo publicitario ni se comparte información con redes de publicidad.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Modificaciones</h2>
            <p>
              Esta política puede actualizarse. Ante cambios sustanciales, se notificará al titular de la cuenta
              por email con al menos 15 días de anticipación. El uso continuado del servicio implica la aceptación
              de la política vigente.
            </p>
          </section>

        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 OpticWare · <Link href="/terms" className="hover:underline">Términos y Condiciones</Link>
        </p>
      </div>
    </div>
  )
}
