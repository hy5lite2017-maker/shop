# AnimeStyle — Progreso del proyecto

## Línea de trabajo

### 1. Diseño inicial
- Creación de maqueta HTML/CSS para tienda de ropa anime online
- Dark mode, bento grid, hero section, product grid, trust badges

### 2. Mejora del diseño ("como los grandes, toque cute")
- Paleta cute: rosas, lavandas, cyan, amarillos pastel
- Tipografía enorme (Outfit, hasta 5.5rem)
- Iconos grandes (3.5rem - 4rem)
- Glassmorphism en navbar
- Scroll reveal animations
- Nuevas secciones: testimonios, newsletter, FAQ, footer completo
- Carrito funcional con JavaScript
- Vista rápida en productos

### 3. Separación de archivos
- `index.html` → solo HTML
- `styles.css` → CSS separado
- `script.js` → JS separado
- `data.js` → datos compartidos

### 4. Panel Admin
- `admin.html`, `admin.css`, `admin.js`
- Login protegido, CRUD de productos, imagen por URL
- Los cambios persisten en localStorage

### 5. Mejoras del Admin
- Subida de imágenes por archivo (FileReader → base64)
- **Gestión de pedidos**: tabla, cambio de estado, pedidos demo
- **Cupones de descuento**: CRUD, activar/desactivar, expiración
- **Analytics**: ingresos, productos vendidos, top productos con barras
- Tabs de navegación (Productos, Pedidos, Cupones, Analytics)

### 6. Carrito + Checkout en la tienda
- Modal de carrito con cantidades (+/−)
- Cupón aplicable desde el carrito
- Modal de checkout (nombre, email, dirección, pago)
- Generación de pedidos desde la tienda → visibles en admin

## Archivos actuales
```
shop/
├── index.html    (330+ líneas — HTML con modales de carrito y checkout)
├── styles.css    (430+ líneas — CSS completo con modales)
├── script.js     (250+ líneas — JS con cart, checkout, cupones)
├── data.js       (90+ líneas  — datos: productos, pedidos, cupones + helpers)
├── admin.html    (200+ líneas — panel con tabs)
├── admin.css     (300+ líneas — estilos admin con tabs y componentes)
├── admin.js      (400+ líneas — lógica admin completa)
└── PROGRESO.md   (este archivo)
```

## Funcionalidades

### Tienda (index.html)
- Catálogo dinámico desde data.js / localStorage
- Carrito modal con suma/resta de cantidades
- Cupones de descuento en el carrito
- Checkout con formulario de envío y método de pago
- Generación de pedidos (visibles en admin)
- FAQ, newsletter, testimonios
- Link al panel admin en el footer

### Panel Admin (admin.html)
- **Login** protegido (`admin` / `admin123`)
- **Tabs**: Productos, Pedidos, Cupones, Analytics
- **Productos**: CRUD completo + subida de imagen por archivo o URL
- **Pedidos**: listado, cambio de estado (pendiente → procesando → enviado → entregado), pedidos demo precargados
- **Cupones**: CRUD, activar/desactivar, tipo (% o $), compra mínima, expiración
- **Analytics**: ingresos totales, pedidos, productos vendidos, ticket promedio, top 5 productos más vendidos con barras
- **Restaurar** productos/cupones por defecto

## Próximos pasos posibles
- [ ] Convertir a React / Next.js
- [ ] Agregar backend (Node.js + BD) para persistencia real
- [ ] Autenticación real con JWT
- [ ] Página de detalle de producto (tallas, galería)
- [ ] Filtros y búsqueda funcional
- [ ] Modo claro/oscuro toggle
- [ ] Conexión a pasarela de pago (Stripe, PayPal)
- [ ] Notificaciones de pedidos
