// Se guarda la etiqueta "video" del HTML en la variable video
const video = document.getElementById('video');

// Cargar los modelos de FaceApi
async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('./modules');
    await faceapi.nets.faceRecognitionNet.loadFromUri('./modules');
    await faceapi.nets.faceLandmark68Net.loadFromUri('./modules');
    alert ("Modelos cargados")
}

// Iniciar el video de la cámara
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accediendo a la cámara: ", err);
    }
}

// Cargar imágenes etiquetadas para reconocimiento
async function loadLabeledImages() {
    try {
        // Obtén la lista de imágenes de la carpeta "faces" desde el servidor
        const response = await fetch('/api/faces');
        const imageFiles = await response.json();

        return Promise.all(
            imageFiles.map(async fileName => {
                const label = fileName.split('.')[0]; // Usa el nombre del archivo sin la extensión como etiqueta
                const imgUrl = `faces/${fileName}`;
                const img = await faceapi.fetchImage(imgUrl);
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                if (!detections) {
                    throw new Error(`No se detectó un rostro en la imagen ${label}`);
                }
                return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
            })
        );
    } catch (error) {
        console.error('Error al cargar las imágenes etiquetadas: ', error);
    }
}

// Ejecutar el flujo de inicio
loadModels().then(startVideo);

// Iniciar el reconocimiento y dibujar cuadros sobre los rostros
video.addEventListener('play', async () => {
    const labeledFaceDescriptors = await loadLabeledImages();
    /**
     * IMPORTANTE: El valor del face matcher (0,6) en este cazo, 
     * se puede modificar dependiendo las circunstancias, entre menor sea el valor
     * el programa va a reconocer mas facil los rostros pero aumenta la probabilidad
     * de falsos positivos.  
     */
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6); // Ajusta el valor según la precisión deseada
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        //Usa los modelos de FaceApi para detectar los rostros
        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Limpiar el canvas
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar cuadros alrededor de todos los rostros detectados
        faceapi.draw.drawDetections(canvas, resizedDetections);

        // Comparar los rostros detectados con los almacenados
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
            drawBox.draw(canvas);

            const labelElement = document.getElementById("isRecognized");
            if (labelElement) {
                if (result.label !== 'unknown') {
                    labelElement.innerHTML = `Reconocido: ${result.label}`;
                } else {
                    labelElement.innerHTML = "No reconocido";
                }
            }
        });
    }, 100);
});
