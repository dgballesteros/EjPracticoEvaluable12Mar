// Espera a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {

    // Inicializa el mapa centrado en Málaga con zoom 14
    const map = L.map('map').setView([36.7213, -4.4214], 14);

    // Añade la capa de OpenStreetMap al mapa
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Referencia al botón de login del navbar
    const loginBtn = document.getElementById('btn-login');

    // Comprueba si hay un usuario guardado en localStorage
    function isLoggedIn() {
        return localStorage.getItem('usuario') !== null;
    }

    // Actualiza el texto y estilo del botón según el estado de sesión
    function updateLogin() {
        if (isLoggedIn()) {
            loginBtn.textContent = 'Logout';
            loginBtn.classList.remove('btn-outline-light');
            loginBtn.classList.add('btn-light');
        } else {
            loginBtn.textContent = 'Login';
            loginBtn.classList.remove('btn-light');
            loginBtn.classList.add('btn-outline-light');
        }
    }

    updateLogin();

    loginBtn.addEventListener('click', function() {

        if (isLoggedIn()) {
            // Si está logueado, cierra sesión y limpia localStorage
            localStorage.removeItem('usuario');
            updateLogin();
            updateFavorites();
            Swal.fire({ title: 'Sesión cerrada', icon: 'success', heightAuto: false });
        } else {
            // Si no está logueado, muestra el modal de login con SweetAlert2
            Swal.fire({
                title: '<span class="text-primary fw-bold">Iniciar Sesión</span>',
                html:
                    '<div class="text-start px-2">' +
                        '<label class="form-label fw-semibold text-muted" for="swal-user">Usuario</label>' +
                        '<input type="text" id="swal-user" class="form-control form-control-lg mb-3" placeholder="Introduce tu usuario">' +
                        '<label class="form-label fw-semibold text-muted" for="swal-pass">Contraseña</label>' +
                        '<input type="password" id="swal-pass" class="form-control form-control-lg" placeholder="Introduce tu contraseña">' +
                    '</div>',
                confirmButtonText: 'Entrar',
                confirmButtonColor: '#0d6efd',
                showCancelButton: true,
                cancelButtonText: 'Cancelar',
                focusConfirm: false,
                heightAuto: false,
                customClass: {
                    confirmButton: 'btn btn-primary rounded-pill px-4',
                    cancelButton: 'btn btn-outline-secondary rounded-pill px-4'
                },
                // Valida las credenciales antes de confirmar
                preConfirm: function() {
                    const user = document.getElementById('swal-user').value;
                    const pass = document.getElementById('swal-pass').value;
                    if (user !== 'admin' || pass !== '1234') {
                        Swal.showValidationMessage('Usuario o contraseña incorrectos');
                        return false;
                    }
                    return user;
                }
            }).then(function(result) {
                // Si el login es correcto, guarda el usuario y actualiza la interfaz
                if (result.isConfirmed) {
                    localStorage.setItem('usuario', result.value);
                    updateLogin();
                    updateFavorites();
                    Swal.fire({ title: '¡Bienvenido!', text: 'Hola, ' + result.value, icon: 'success', confirmButtonColor: '#0d6efd', heightAuto: false });
                }
            });
        }
    });

    // Obtiene la lista de favoritos guardados en localStorage
    function getFavorites() {
        const saved = localStorage.getItem('favoritos');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    // Añade o elimina un monumento de la lista de favoritos
    function toggleFavorite(id) {
        const favs = getFavorites();
        const idx = favs.indexOf(id);
        if (idx === -1) {
            favs.push(id);
        } else {
            favs.splice(idx, 1);
        }
        localStorage.setItem('favoritos', JSON.stringify(favs));
    }

    // Actualiza la visibilidad y color de los botones de favoritos
    function updateFavorites() {
        const loggedIn = isLoggedIn();
        const favs = getFavorites();
        // Recorre todos los botones que tengan data-id
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(function(btn) {
            if (!btn.dataset.id) return;
            const id = parseInt(btn.dataset.id);
            if (loggedIn) {
                // Muestra el botón y marca en rojo si es favorito
                btn.classList.remove('d-none');
                if (favs.indexOf(id) !== -1) {
                    btn.classList.remove('text-secondary');
                    btn.classList.add('text-danger');
                } else {
                    btn.classList.remove('text-danger');
                    btn.classList.add('text-secondary');
                }
            } else {
                // Oculta el botón si no hay sesión iniciada
                btn.classList.add('d-none');
                btn.classList.remove('text-danger');
                btn.classList.add('text-secondary');
            }
        });
    }

    // Carga los monumentos desde caché o desde la API
    function loadMonuments() {
        const cache = localStorage.getItem('monumentos_cache');

        if (cache) {
            // Si hay datos en caché, los usa directamente
            renderMonuments(JSON.parse(cache));
        } else {
            // Si no hay caché, hace fetch a la API
            fetch('/api/monumentos')
                .then(function(res) {
                    return res.json();
                })
                .then(function(data) {
                    // Guarda los datos en localStorage para futuras cargas
                    localStorage.setItem('monumentos_cache', JSON.stringify(data));
                    renderMonuments(data);
                })
                .catch(function(err) {
                    console.log('Error al cargar los datos', err);
                    Swal.fire({ title: 'Error', text: 'No se pudieron cargar los datos', icon: 'error', heightAuto: false });
                });
        }
    }

    // Dibuja los marcadores en el mapa y los elementos en el listado lateral
    function renderMonuments(data) {
        const features = data.features;
        const list = document.getElementById('lista-monumentos');

        features.forEach(function(feature) {
            const props = feature.properties;
            const geom = feature.geometry;

            // Salta si no hay coordenadas válidas
            if (!geom || !geom.coordinates) return;

            const lng = geom.coordinates[0];
            const lat = geom.coordinates[1];
            const name = props.NOMBRE;
            const address = props.DIRECCION ? props.DIRECCION.trim() : '';
            const id = props.ID;

            // Crea un marcador en el mapa para este monumento
            const marker = L.marker([lat, lng]).addTo(map);

            // Al hacer clic en el marcador, centra el mapa y muestra el modal
            marker.on('click', function() {
                map.setView([lat, lng], 19);
                showModal(props);
            });

            // Crea el elemento de lista con nombre, dirección y botón de favorito
            const li = document.createElement('li');
            li.className = 'd-flex flex-column p-3 border-bottom';
            li.innerHTML =
                '<div class="item-info flex-grow-1">' +
                    '<div class="nombre fw-bold">' + name + '</div>' +
                    '<div class="direccion small text-muted mt-1">' + address + '</div>' +
                '</div>' +
                '<div class="mt-2"><button type="button" class="btn btn-sm btn-light lh-1 border rounded text-secondary d-none" data-id="' + id + '">♥</button></div>';

            // Al hacer clic en la info del listado, centra el mapa y muestra el modal
            li.querySelector('.item-info').addEventListener('click', function() {
                map.setView([lat, lng], 19);
                showModal(props);
            });

            // Al hacer clic en el botón de favorito, lo añade o quita de favoritos
            li.querySelector('[data-id]').addEventListener('click', function(e) {
                e.stopPropagation();
                if (!isLoggedIn()) {
                    Swal.fire({ title: 'Aviso', text: 'Debes iniciar sesión para guardar favoritos', icon: 'warning', heightAuto: false });
                    return;
                }
                toggleFavorite(id);
                updateFavorites();
            });

            // Añade el elemento a la lista del sidebar
            list.appendChild(li);
        });

        // Actualiza el estado visual de los favoritos
        updateFavorites();
    }

    // Muestra un modal con la información detallada de un monumento
    function showModal(props) {
        Swal.fire({
            icon: 'info',
            title: '<span class="text-primary fw-bold">' + props.NOMBRE + '</span>',
            html:
                '<div class="text-start px-2">' +
                    '<p class="mb-2"><b>Dirección:</b> ' + (props.DIRECCION || '') + '</p>' +
                    '<p class="text-muted">' + (props.DESCRIPCION || '') + '</p>' +
                '</div>',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0d6efd',
            heightAuto: false,
            customClass: {
                confirmButton: 'btn btn-primary rounded-pill px-4'
            }
        }).then(function() {
            // Recalcula el tamaño del mapa tras cerrar el modal
            map.invalidateSize();
        });
    }

    loadMonuments();

});
