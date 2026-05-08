// 1. Cargar los módulos necesarios
const http = require('http');          // servidor HTTP nativo de Node
const fs = require('fs');              // para leer archivos (index.html)
const path = require('path');
const WebSocket = require('ws');       // librería de WebSocket

// 2. Configurar el servidor HTTP que servirá el archivo HTML
const server = http.createServer((req, res) => {
    // Solo servimos el index.html sin importar la ruta (simplicidad)
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error al cargar la página');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

// 3. Crear el servidor WebSocket adjunto al servidor HTTP
const wss = new WebSocket.Server({ server });

// 4. Función para generar un nombre de usuario aleatorio
function generarNombreUsuario() {
    return 'Usuario_' + Math.floor(Math.random() * 900 + 100); // entre 100 y 999
}

// 5. Manejar las conexiones WebSocket
wss.on('connection', (ws) => {
    // Asignar nombre temporal automáticamente
    ws.username = generarNombreUsuario();
    console.log(`${ws.username} se ha conectado`);

    // Notificar a todos los clientes que alguien se unió
    broadcast({ tipo: 'sistema', mensaje: `${ws.username} se ha unido al chat.` });

    // Enviar al nuevo cliente su propio nombre
    ws.send(JSON.stringify({ tipo: 'identidad', username: ws.username }));

    // Escuchar mensajes del cliente
    ws.on('message', (data) => {
        try {
            const obj = JSON.parse(data.toString());
            // Reenviar el mensaje a todos, incluyendo quién lo envía
            broadcast({
                tipo: 'chat',
                username: ws.username,
                mensaje: obj.mensaje
            });
        } catch (e) {
            console.error('Mensaje con formato incorrecto');
        }
    });

    // Manejar desconexión
    ws.on('close', () => {
        console.log(`${ws.username} se ha desconectado`);
        broadcast({ tipo: 'sistema', mensaje: `${ws.username} ha abandonado el chat.` });
    });

    // Evitar desconexiones silenciosas (opcional)
    ws.on('error', () => {});
});

// Función broadcast: envía un objeto JSON a todos los clientes conectados
function broadcast(data) {
    const mensaje = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(mensaje);
        }
    });
}

// 6. Iniciar el servidor en el puerto 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});