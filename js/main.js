//lista de productos
document.addEventListener("DOMContentLoaded", async () => {
    const productos = await cargarProductos();
    // Renderizar productos en index.html con filtros y orden por precios
    if (window.location.pathname.includes("index.html") || window.location.pathname === "/" || window.location.pathname === "") {
        const productSection = document.querySelector(".lista-productos");
        const filtrarSelect = document.getElementById("filtrar");
        const ordenarSelect = document.getElementById("ordenar");
        const busquedaInput = document.getElementById("busqueda");

        function renderizarProductos() {
            const categoriaSeleccionada = filtrarSelect.value;
            const ordenSeleccionado = ordenarSelect.value;
            const textoBusqueda = busquedaInput.value.toLowerCase();

            let filtrados = productos.filter(producto => {
                const coincideCategoria = categoriaSeleccionada === "todos" || producto.categoria === categoriaSeleccionada;
                const coincideBusqueda = producto.nombre.toLowerCase().includes(textoBusqueda);
                return coincideCategoria && coincideBusqueda;
            });

            // Ordenamiento
            if (ordenSeleccionado === "meno-mayor") {
                filtrados.sort((a, b) => a.precio - b.precio);
            } else if (ordenSeleccionado === "mayor-menor") {
                filtrados.sort((a, b) => b.precio - a.precio);
            }

            // Limpiar antes de volver a renderizar
            productSection.innerHTML = "";

            // Renderizar los productos filtrados
            filtrados.forEach(producto => {
                const id = generarId(producto.nombre);
                const div = document.createElement("div");
                div.className = "producto";
                div.innerHTML = `
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <h2>${producto.nombre}</h2>
                    <p class="precio">$${producto.precio}</p>
                    <p class="descripcion">${producto.descripcion}</p>
                `;
                const boton = crearBotonAccion("Ver más", "", () => {
                    localStorage.setItem("productoSeleccionado", id);
                    window.location.href = "producto.html";
                });
                div.appendChild(boton);
                productSection.appendChild(div);
            });

            actualizarContadorCarrito();
        }

        // Escuchamos eventos en los controles
        filtrarSelect.addEventListener("change", renderizarProductos);
        ordenarSelect.addEventListener("change", renderizarProductos);
        busquedaInput.addEventListener("input", renderizarProductos);

        // Primera carga
        renderizarProductos();
    }


    // Renderizar producto producto.html
    if (window.location.pathname.includes("producto.html")) {
        const id = localStorage.getItem("productoSeleccionado");
        const producto = productos.find(p => generarId(p.nombre) === id);

        if (producto) {
            document.querySelector(".lista-productos img").src = producto.imagen;
            document.querySelector(".lista-productos img").alt = producto.nombre;
            document.querySelector(".lista-productos h2").textContent = producto.nombre;
            document.querySelector(".lista-productos .precio").textContent = `$${producto.precio}`;
            document.querySelector(".lista-productos .descripcion").textContent = producto.descripcionExtendida;

            document.querySelector(".boton-comprar").addEventListener("click", () => {
                const productoComprado = [{
                    nombre: producto.nombre,
                    imagen: producto.imagen,
                    precio: producto.precio,
                    cantidad: 1
                }];
                localStorage.setItem("compraRealizada", JSON.stringify(productoComprado));
                window.location.href = "compra.html";
                document.querySelector(".boton-comprar").addEventListener("click", () => {
                    const productoComprado = [{
                        nombre: producto.nombre,
                        imagen: producto.imagen,
                        precio: producto.precio,
                        cantidad: 1
                    }];
                    localStorage.setItem("compraRealizada", JSON.stringify(productoComprado));

                    // Quitar solo este producto del carrito
                    const carrito = obtenerCarrito().filter(item => item.id !== id);
                    guardarCarrito(carrito);

                    window.location.href = "compra.html";
                });

            });


            document.querySelector(".boton-agregar-carrito").addEventListener("click", () => {
                const carrito = obtenerCarrito();
                const existente = carrito.find(item => item.id === id);
                if (existente) {
                    existente.cantidad += 1;
                } else {
                    carrito.push({ id, cantidad: 1 });
                }
                guardarCarrito(carrito);
                actualizarContadorCarrito();
            });
        }

        actualizarContadorCarrito();
    }

    // Renderizar productos en carrito.html
    if (window.location.pathname.includes("carrito.html")) {
        const carrito = obtenerCarrito();
        const productSection = document.querySelector(".lista-productos");

        if (!productSection || carrito.length === 0) {
            document.querySelector("main").innerHTML = `
                <p>Tu carrito está vacío.</p>
                <button class="boton-accion" onclick="window.location.href='index.html'">← Seguir comprando</button>
            `;
        } else {
            let total = 0;

            carrito.forEach(item => {
                const productoOriginal = productos.find(p => generarId(p.nombre) === item.id);
                if (!productoOriginal) return;

                const div = document.createElement("div");
                div.className = "producto";
                div.innerHTML = `
                    <img src="${productoOriginal.imagen}" alt="${productoOriginal.nombre}">
                    <h2>${productoOriginal.nombre}</h2>
                    <p class="precio">$${productoOriginal.precio} x ${item.cantidad} = $${productoOriginal.precio * item.cantidad}</p>
                `;
                total += productoOriginal.precio * item.cantidad;

                const botonEliminar = crearBotonAccion("Eliminar del carrito", "", () => {
                    const carritoActualizado = obtenerCarrito().map(p =>
                        p.id === item.id ? { ...p, cantidad: p.cantidad - 1 } : p
                    ).filter(p => p.cantidad > 0);

                    guardarCarrito(carritoActualizado);
                    location.reload();
                });

                div.appendChild(botonEliminar);
                productSection.appendChild(div);
            });

            const totalDiv = document.createElement("div");
            totalDiv.className = "resumen-total";
            totalDiv.innerHTML = `
        Total a pagar: $${total}
        <button class="boton-accion boton-comprar-carrito">Comprar</button>
        <button class="boton-regreso" onclick="window.location.href='index.html'">regresar</button>
    `;
            productSection.appendChild(totalDiv);

            // Acción del botón "Comprar"
            const botonComprar = totalDiv.querySelector(".boton-comprar-carrito");
            botonComprar.addEventListener("click", () => {
                const productosComprados = carrito.map(item => {
                    const productoOriginal = productos.find(p => generarId(p.nombre) === item.id);
                    return {
                        nombre: productoOriginal.nombre,
                        imagen: productoOriginal.imagen,
                        precio: productoOriginal.precio,
                        cantidad: item.cantidad
                    };
                });

                localStorage.setItem("compraRealizada", JSON.stringify(productosComprados));
                localStorage.removeItem("listaCarrito");
                window.location.href = "compra.html";
            });

            actualizarContadorCarrito();
        }

    }

    // Renderizar productos en compra.html
    if (window.location.pathname.includes("compra.html")) {
        const productosComprados = JSON.parse(localStorage.getItem("compraRealizada")) || [];
        const section = document.querySelector(".lista-productos");

        if (productosComprados.length === 0) {
            section.innerHTML = "<p>No se encontró una compra reciente.</p>";
        } else {
            productosComprados.forEach(p => {
                const div = document.createElement("div");
                div.className = "producto";
                div.innerHTML = `
                    <img src="${p.imagen}" alt="${p.nombre}">
                    <h2>${p.nombre}</h2>
                    <p class="precio">$${p.precio} x ${p.cantidad} = $${p.precio * p.cantidad}</p>
                `;
                section.appendChild(div);
            });
        }

        actualizarContadorCarrito(); // resetea a 0 si no hay productos
    }
})


//-------------------------------------funciones----------------------------------------------------

// Utilidad para convertir nombre a ID URL-safe
function generarId(nombre) {
    return nombre.toLowerCase().replace(/\s+/g, "-");
}

// Guardar carrito en localStorage
function guardarCarrito(carrito) {
    localStorage.setItem("listaCarrito", JSON.stringify(carrito));
}

// Traigo arreglo de productos
async function cargarProductos() {
    try {
        const respuesta = await fetch('recursos/productos.json');
        if (!respuesta.ok) {
            throw new Error(`Error al cargar productos: ${respuesta.status} ${respuesta.statusText}`);
        }
        const productos = await respuesta.json();
        return productos;
    } catch (error) {
        console.error('Hubo un problema al obtener los productos:', error);
        return []; // Devuelve un arreglo vacío en caso de error
    }
}

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem("listaCarrito")) || [];
}

function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const contador = document.getElementById("contador-carrito");
    if (contador) contador.textContent = total;
}

function crearBotonAccion(texto, claseExtra = "", onClick) {
    const boton = document.createElement("button");
    boton.textContent = texto;
    boton.className = `boton-accion ${claseExtra}`.trim();
    boton.addEventListener("click", onClick);
    return boton;
}