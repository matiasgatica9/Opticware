import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-emerald-700 text-sm font-medium hover:underline">
            ← Volver a OpticWare
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Términos y Condiciones</h1>
          <p className="text-sm text-gray-500 mt-1">Última actualización: junio de 2026</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Aceptación de los términos</h2>
            <p>
              Al registrarse y utilizar OpticWare (en adelante, "el Servicio"), el usuario acepta de forma expresa
              estos Términos y Condiciones y la{" "}
              <Link href="/privacy" className="text-emerald-700 hover:underline">Política de Privacidad</Link>.
              Si no está de acuerdo con alguno de estos términos, no debe utilizar el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Descripción del Servicio</h2>
            <p>
              OpticWare es una plataforma de gestión empresarial diseñada para ópticas, que incluye funcionalidades
              de administración de pacientes, historia clínica, agenda de turnos, gestión de ventas, control de stock,
              facturación, órdenes de laboratorio y reportes.
            </p>
            <p className="mt-2">
              El Servicio se provee "tal cual está" (as is) y puede ser modificado, ampliado o discontinuado en
              cualquier momento con notificación previa de al menos 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Registro y cuenta</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Para usar el Servicio es necesario crear una cuenta con información verídica.</li>
              <li>El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Cada cuenta corresponde a una única óptica o establecimiento comercial.</li>
              <li>El usuario es responsable de toda actividad realizada desde su cuenta.</li>
              <li>Se prohíbe ceder, vender o compartir el acceso a la cuenta con terceros no autorizados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Uso permitido</h2>
            <p className="mb-2">El usuario se compromete a utilizar el Servicio exclusivamente para fines lícitos y en conformidad con:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La legislación argentina vigente.</li>
              <li>La <strong>Ley 25.326</strong> de Protección de Datos Personales.</li>
              <li>Las normas de ejercicio profesional aplicables a la actividad óptica.</li>
            </ul>
            <p className="mt-2">Queda expresamente prohibido:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Ingresar datos falsos o de terceros sin su consentimiento.</li>
              <li>Intentar vulnerar la seguridad del sistema.</li>
              <li>Usar el Servicio para actividades fraudulentas o ilegales.</li>
              <li>Realizar ingeniería inversa sobre el software.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Datos de pacientes y responsabilidad del usuario</h2>
            <p>
              El usuario (la óptica) es el responsable del tratamiento de los datos personales de sus pacientes
              conforme a la Ley 25.326. Debe contar con el consentimiento informado de cada paciente antes de
              ingresar sus datos al sistema.
            </p>
            <p className="mt-2">
              OpticWare no se responsabiliza por el uso indebido que el usuario haga de los datos de sus pacientes,
              ni por incumplimientos legales derivados de la falta de consentimiento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Facturación y obligaciones fiscales</h2>
            <p>
              Los comprobantes generados por OpticWare tienen carácter de <strong>comprobantes internos de gestión</strong>.
              El usuario es el único responsable del cumplimiento de sus obligaciones fiscales ante AFIP
              y cualquier organismo tributario provincial o municipal.
              OpticWare no reemplaza ni asume ninguna responsabilidad respecto a la emisión de comprobantes
              fiscales válidos ante AFIP.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Disponibilidad del servicio</h2>
            <p>
              Nos esforzamos por mantener el Servicio disponible de forma continua, pero no garantizamos
              disponibilidad ininterrumpida. Pueden existir interrupciones por mantenimiento, actualizaciones
              o causas de fuerza mayor. No somos responsables por pérdidas derivadas de interrupciones del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Limitación de responsabilidad</h2>
            <p>
              En ningún caso OpticWare será responsable por daños indirectos, incidentales, especiales o
              consecuentes derivados del uso o imposibilidad de uso del Servicio, incluyendo pérdida de datos,
              pérdida de ingresos o daños comerciales.
            </p>
            <p className="mt-2">
              La responsabilidad total de OpticWare ante el usuario no excederá el monto abonado por el
              Servicio durante los últimos 3 meses.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Propiedad intelectual</h2>
            <p>
              Todo el software, diseño, código, marcas y contenidos de OpticWare son propiedad exclusiva del
              Servicio y están protegidos por las leyes de propiedad intelectual aplicables.
              El usuario recibe una licencia de uso personal, no exclusiva e intransferible para acceder al Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. Cancelación y baja de cuenta</h2>
            <p>
              El usuario puede cancelar su cuenta en cualquier momento desde la configuración del sistema o
              enviando una solicitud a <strong>contacto@opticware.site</strong>.
            </p>
            <p className="mt-2">
              OpticWare se reserva el derecho de suspender o cancelar cuentas que violen estos Términos,
              con notificación previa salvo en casos de violaciones graves o actividad fraudulenta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">11. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios
              sustanciales serán notificados por email con al menos 15 días de anticipación.
              El uso continuado del Servicio tras la notificación implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">12. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de la <strong>República Argentina</strong>.
              Para cualquier controversia derivada del uso del Servicio, las partes se someten a la
              jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires,
              con renuncia expresa a cualquier otro fuero.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">13. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos Términos:
              <strong> contacto@opticware.site</strong>
            </p>
          </section>

        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 OpticWare · <Link href="/privacy" className="hover:underline">Política de Privacidad</Link>
        </p>
      </div>
    </div>
  )
}
