# 🎬 Guión — Video Demo OpticWare
**Duración estimada:** 5–8 minutos  
**Herramienta recomendada:** OBS Studio, Loom o la Grabadora de pantalla de Windows (Win + G)  
**URL de la app:** https://opticware.site  
**Tip:** grabá con resolución 1920×1080, cursor visible, sin notificaciones del sistema.

---

## INTRO (0:00 – 0:20)
> *Mostrá la pantalla de login*

**Locución:**
> "OpticWare es un sistema de gestión diseñado específicamente para ópticas. Desde la historia clínica del paciente hasta la facturación, todo en un solo lugar. Vamos a recorrer todas las funcionalidades."

**Acción:** Ingresá con tu usuario y mostrá el acceso al dashboard.

---

## 1. DASHBOARD (0:20 – 1:00)
**Pantalla:** `/dashboard`

**Qué mostrar:**
- Los 4 cards de métricas: Pacientes activos, Turnos pendientes, Ventas del día, Stock bajo
- La sección "Próximos turnos" (scrolleá si hay datos)
- La sección "Últimas ventas de hoy"

**Locución:**
> "Al entrar, el dashboard te muestra el pulso del día: cuántos pacientes activos tiene la óptica, los turnos pendientes, el total de ventas de hoy y si hay algún producto con stock bajo. También ves los próximos turnos y las últimas ventas en tiempo real."

---

## 2. PACIENTES (1:00 – 2:30)

### 2a. Listado
**Pantalla:** `/patients`

**Qué mostrar:**
- La lista de pacientes con buscador
- Filtrá por nombre en el buscador

**Locución:**
> "El módulo de pacientes te permite buscar rápidamente cualquier paciente por nombre."

---

### 2b. Nuevo paciente
**Pantalla:** `/patients/new`

**Qué mostrar:**
- Completá solo el campo Nombre (demostrá que es el único obligatorio)
- Guardá y mostrá que redirige al perfil

**Locución:**
> "Crear un paciente es muy simple — solo el nombre es obligatorio. El resto de los datos se pueden completar después."

---

### 2c. Ficha del paciente
**Pantalla:** `/patients/[id]`

**Qué mostrar:**
- Datos personales y de contacto
- Botón de WhatsApp si tiene teléfono
- Sección Historia clínica con recetas (si hay)
- Sección Historial de compras con las ventas vinculadas

**Locución:**
> "La ficha del paciente centraliza todo: sus datos, cómo contactarlo por WhatsApp, su historia clínica con todas las recetas ordenadas, y el historial completo de compras con los productos que llevó en cada visita."

---

### 2d. Nueva receta
**Pantalla:** `/patients/[id]/prescriptions/new`

**Qué mostrar:**
- El formulario con los campos OD y OI (esfera, cilindro, eje, adición, DIP)
- Selector de tipo de lente y material
- Guardá la receta

**Locución:**
> "Desde la ficha podés agregar una nueva receta oftalmológica con todos los parámetros: ojo derecho e izquierdo, tipo de lente, material y tratamientos."

---

## 3. AGENDA (2:30 – 3:15)

### 3a. Listado / vista semanal
**Pantalla:** `/agenda`

**Qué mostrar:**
- El calendario semanal con los turnos
- Los estados de cada turno (pendiente, confirmado, completado)

**Locución:**
> "La agenda muestra todos los turnos de la semana. Podés ver rápidamente quién tiene turno, a qué hora y el estado de cada cita."

---

### 3b. Nuevo turno
**Pantalla:** `/agenda/new`

**Qué mostrar:**
- Seleccioná un paciente
- Elegí fecha, hora y tipo de turno
- Guardá

**Locución:**
> "Crear un turno es muy rápido: buscás el paciente, elegís el día y la hora, y confirmás."

---

### 3c. Detalle del turno
**Pantalla:** `/agenda/[id]`

**Qué mostrar:**
- Los datos del turno
- El botón de WhatsApp para recordatorio
- Cambio de estado

**Locución:**
> "Desde el detalle del turno podés enviar un recordatorio por WhatsApp al paciente con un solo clic, o actualizar el estado a confirmado o completado."

---

## 4. VENTAS (3:15 – 4:00)

### 4a. Nueva venta
**Pantalla:** `/sales/new`

**Qué mostrar:**
- Seleccioná un paciente
- Buscá y agregá productos al carrito
- Elegí método de pago
- Confirmá la venta

**Locución:**
> "Para registrar una venta, buscás el paciente, agregás los productos, el sistema descuenta el stock automáticamente, elegís cómo paga y listo."

---

### 4b. Detalle de venta
**Pantalla:** `/sales/[id]`

**Qué mostrar:**
- Los ítems de la venta con precios
- El botón "Emitir factura" (si no tiene factura aún)
- El botón "Enviar resumen de factura" por WhatsApp (si ya tiene factura)

**Locución:**
> "Desde el detalle de la venta podés emitir la factura con un clic, y una vez generada, enviar el resumen directamente al WhatsApp del paciente."

---

## 5. FACTURACIÓN (4:00 – 4:45)

### 5a. Nueva factura
**Pantalla:** `/invoicing/new`

**Qué mostrar:**
- Seleccioná el paciente → aparece su obra social automáticamente con el % de descuento
- Mostrá que el descuento es editable
- Agregá ítems
- Mostrá el cálculo de subtotal, descuento y total
- Emitir factura

**Locución:**
> "Al crear una factura, si el paciente tiene obra social, el descuento se aplica automáticamente — y podés ajustarlo manualmente para cada caso. El sistema calcula todo en tiempo real."

---

### 5b. Comprobante
**Pantalla:** `/invoicing/[id]`

**Qué mostrar:**
- El comprobante limpio con datos del negocio, cliente e ítems
- Botón de imprimir/descargar PDF

**Locución:**
> "El comprobante generado incluye todos los datos listos para imprimir o guardar como PDF."

---

## 6. STOCK (4:45 – 5:20)

**Pantalla:** `/stock`

**Qué mostrar:**
- La lista de productos con stock actual
- El indicador visual de stock bajo (en rojo o naranja)
- Entrá a un producto y mostrá el formulario de edición / ajuste de stock

**Locución:**
> "El módulo de stock muestra todos los productos con sus cantidades actuales. Los que están por debajo del mínimo aparecen destacados. Podés ajustar el stock manualmente en cualquier momento."

---

## 7. ÓRDENES DE LABORATORIO (5:20 – 5:50)

**Pantalla:** `/lab-orders`

**Qué mostrar:**
- La lista de trabajos enviados al laboratorio
- Creá una nueva orden: paciente, tipo de trabajo, laboratorio, fecha de entrega, precio
- Mostrá el detalle con el estado del trabajo y los datos de pago

**Locución:**
> "Las órdenes de laboratorio te permiten hacer seguimiento de cada trabajo enviado al lab: qué encargaste, para qué paciente, cuándo llega y cuánto pagaste."

---

## 8. OBRAS SOCIALES (5:50 – 6:10)

**Pantalla:** `/obras-sociales`

**Qué mostrar:**
- La lista de obras sociales configuradas con su % de descuento
- Mencioná que al vincular una OS a un paciente, se aplica automáticamente en la factura

**Locución:**
> "Configurás las obras sociales una vez con su porcentaje de descuento. Después, al vincularse a un paciente, se aplica solo en cada factura."

---

## 9. PROVEEDORES (6:10 – 6:30)

**Pantalla:** `/suppliers`

**Qué mostrar:**
- La lista de proveedores
- Entrá a uno y mostrá sus datos de contacto

**Locución:**
> "El módulo de proveedores mantiene un directorio con todos los datos de contacto de cada proveedor."

---

## 10. REPORTES (6:30 – 7:00)

**Pantalla:** `/reports`

**Qué mostrar:**
- Los gráficos de ventas por período
- Métricas de productos más vendidos
- Filtros de fecha

**Locución:**
> "Los reportes te dan una visión clara del rendimiento de la óptica: evolución de ventas, productos más vendidos y comparativas por período."

---

## 11. CONFIGURACIÓN (7:00 – 7:20)

**Pantalla:** `/settings`

**Qué mostrar:**
- El logo y nombre del negocio
- CUIT y datos fiscales que aparecen en los comprobantes
- Cualquier otro ajuste disponible

**Locución:**
> "En configuración personalizás la app con los datos de tu óptica: nombre, logo, CUIT y dirección — que aparecen en todos los comprobantes que generás."

---

## CIERRE (7:20 – 7:40)

**Pantalla:** Volvé al dashboard

**Locución:**
> "Eso es OpticWare — todo lo que una óptica necesita para gestionar pacientes, turnos, ventas, stock y facturación en una sola plataforma. Podés probarlo en opticware.site."

---

## 📋 Checklist antes de grabar

- [ ] Tener datos de prueba cargados (al menos 3 pacientes, productos con stock, 1 obra social)
- [ ] Ventana del browser en pantalla completa (F11)
- [ ] Cerrar notificaciones del sistema (Windows: foco asistido activado)
- [ ] Desactivar el protector de pantalla
- [ ] Probar el micrófono antes de empezar
- [ ] Grabar en 1920×1080

## 🛠 Herramientas recomendadas

| Herramienta | Por qué |
|-------------|---------|
| **Loom** (loom.com) | Graba pantalla + cámara, sube automáticamente a la nube, genera link para compartir. Gratis hasta 5 min. |
| **OBS Studio** (obsproject.com) | Gratis, sin límite de tiempo, calidad profesional. Más configuración. |
| **Grabadora de Windows** | Win + G → Grabar. Simple, sin instalar nada. Sin cámara. |
| **Clipchamp** (viene con Windows 11) | Para editar después: recortar, agregar títulos, música de fondo. |
