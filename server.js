//Declaracion de librerias necesarias
/**
 * En este cazo usamos "express" para crear un 
 * servidor web en nuestra computadora y cargar todos
 * los archivos necesarios para el funcionamiento
 * del programa
 */
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

//Hosteamos los archivos de la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

//Declaramos la pagina principal del servidor web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para devolver la lista de imágenes en la carpeta "faces"
app.get('/api/faces', (req, res) => {
    const facesDir = path.join(__dirname, 'public/faces');
    fs.readdir(facesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer la carpeta' });
        }
        // Filtra solo archivos de imagen (puedes ajustar las extensiones según tu caso)
        const imageFiles = files.filter(file => /\.(png|jpg|jpeg)$/i.test(file));
        res.json(imageFiles);
    });
});

//Declaramos el puerto en el que se va a ejecutar
const PORT = process.env.PORT || 3000;
//Ponemos a correr el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});