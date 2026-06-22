# 🎙 Locución — Video Demo OpticWare
**Duración total del video:** 5:35 min  
**Tono:** profesional pero cercano, ritmo tranquilo  
**Herramienta sugerida para generar la voz:** ElevenLabs.io (voz "Mateo" o "Antonio" en español)

---

## [0:00 – 0:15] INTRO

> "Gestionar una óptica implica manejar pacientes, turnos, ventas, stock y facturación al mismo tiempo.
> OpticWare es el sistema que organiza todo eso en un solo lugar, diseñado específicamente para ópticas."

---

## [0:15 – 0:45] DASHBOARD

> "Al ingresar, el dashboard te da el resumen del día al instante.
> Cuántos pacientes activos tiene la óptica, los turnos que están pendientes, cuánto se vendió hoy y si hay productos con stock bajo.
> Abajo, los próximos turnos de la semana y las últimas ventas del día — todo actualizado en tiempo real."

---

## [0:45 – 1:30] PACIENTES

> "El módulo de pacientes centraliza toda la información de cada persona.
> Podés buscar cualquier paciente en segundos, y crear uno nuevo con solo el nombre — sin obligación de completar todos los datos.
>
> Dentro de la ficha de cada paciente encontrás sus datos personales, su número de teléfono con acceso directo a WhatsApp, y su historia clínica completa con todas las recetas oftalmológicas que se le fueron registrando.
>
> Y lo más importante: el historial de compras. Cada venta que hizo en la óptica aparece acá — qué productos llevó, a qué precio, y cuándo fue."

---

## [1:30 – 2:00] RECETAS

> "Agregar una nueva receta es muy sencillo.
> Completás los datos del ojo derecho e izquierdo — esfera, cilindro, eje, adición y distancia interpupilar — elegís el tipo de lente y el material, y la receta queda guardada en la historia clínica del paciente para siempre."

---

## [2:00 – 2:30] AGENDA

> "La agenda muestra todos los turnos de la semana en un solo vistazo.
> Podés ver el estado de cada turno — pendiente, confirmado o completado — y con un solo clic enviarle un recordatorio por WhatsApp al paciente.
> Crear un nuevo turno toma menos de treinta segundos."

---

## [2:30 – 3:10] VENTAS

> "Para registrar una venta, seleccionás el paciente, buscás los productos y los agregás al carrito.
> El sistema descuenta el stock automáticamente al confirmar.
> Elegís el método de pago — efectivo, transferencia, MercadoPago o tarjeta — y la venta queda registrada.
>
> Desde el detalle de cada venta podés emitir la factura con un clic, y una vez generada, enviar el resumen directamente al WhatsApp del paciente."

---

## [3:10 – 3:50] FACTURACIÓN

> "Al crear una factura, si el paciente tiene obra social asignada, el descuento se aplica solo — y podés modificarlo manualmente para cada caso particular.
> El sistema calcula el subtotal, el descuento y el total en tiempo real.
>
> El comprobante generado incluye todos los datos del negocio y del cliente, listo para imprimir o guardar como PDF."

---

## [3:50 – 4:15] STOCK

> "El módulo de stock muestra todos los productos con sus cantidades actuales.
> Los que están por debajo del mínimo configurado aparecen destacados para que sepas cuándo reponer.
> Podés ajustar el stock manualmente en cualquier momento, o que se descuente automáticamente con cada venta."

---

## [4:15 – 4:40] LABORATORIO

> "Las órdenes de laboratorio te permiten hacer seguimiento de cada trabajo enviado al lab.
> Qué encargaste, para qué paciente, cuándo llega y cuánto pagaste — todo registrado y accesible en cualquier momento."

---

## [4:40 – 5:05] OBRAS SOCIALES Y PROVEEDORES

> "Las obras sociales se configuran una sola vez con su porcentaje de descuento, y se aplican automáticamente cuando facturás a un paciente que la tiene asignada.
>
> También tenés un directorio de proveedores con todos sus datos de contacto para tener siempre a mano."

---

## [5:05 – 5:25] REPORTES Y CONFIGURACIÓN

> "Los reportes te muestran la evolución de ventas, los productos más vendidos y las métricas del negocio por el período que necesites.
>
> Y en configuración personalizás la app con el nombre y logo de tu óptica, el CUIT y los datos fiscales que van a aparecer en cada comprobante."

---

## [5:25 – 5:35] CIERRE

> "OpticWare. Todo lo que tu óptica necesita, en un solo sistema.
> Entrá a opticware.site y empezá hoy."

---

## 📌 Cómo generar la voz con ElevenLabs (gratis)

1. Entrá a **elevenlabs.io**
2. Registrate gratis (hasta 10.000 caracteres por mes)
3. Clic en "Text to Speech"
4. Seleccioná idioma **Español** y una voz como **"Mateo"** o **"Daniel"**
5. Pegá el texto sección por sección
6. Descargá cada fragmento en MP3
7. Unilos con **Clipchamp** (viene en Windows 11) o con ffmpeg:
   ```
   ffmpeg -i parte1.mp3 -i parte2.mp3 -filter_complex "[0][1]concat=n=2:v=0:a=1" locucion_completa.mp3
   ```
