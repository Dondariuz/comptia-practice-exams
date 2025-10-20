document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const contenedorExamen = document.getElementById('contenedor-examen');
    const contenedorResultados = document.getElementById('contenedor-resultados');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnFinalizar = document.getElementById('btn-finalizar');
    const contadorPreguntaEl = document.getElementById('contador-pregunta');
    const tiempoEl = document.getElementById('tiempo');
    const tituloExamenEl = document.getElementById('titulo-examen');
    const resultadosDetalladosEl = document.getElementById('resultados-detallados');
    const resultadoCajaEl = document.getElementById('resultado-final-caja');
    const resultadoEstadoEl = document.getElementById('resultado-estado');
    const puntajeEscaladoEl = document.getElementById('puntaje-escalado');
    const puntajeFinalEl = document.getElementById('puntaje-final');
    const mensajeFinalEl = document.getElementById('mensaje-final');

    // Estado del examen
    let preguntas = [];
    let preguntaActualIdx = 0;
    let respuestasUsuario = [];
    let intervaloTimer;
    let examenInfo = {};
    let examId;

    async function iniciarExamen() {
        const params = new URLSearchParams(window.location.search);
        examId = params.get('exam') || '1';
        
        let jsonFile;
        switch (examId) {
            case '2':
                jsonFile = 'Practice_Exam_2_with_answers.json';
                break;
            case '3':
                jsonFile = 'Practice_Exam_3_Mobile_Devices_with_answers.json'; 
                break;
            case '4':
                jsonFile = 'Practice_Exam_4_Networking_with_answers.json';
                break;
            case '5':
                jsonFile = 'Practice_Exam_5.json';
                break;
            case '6':
                jsonFile = 'chapter1-hardware-complete.json';
                break;
            case '7':
                jsonFile = 'chapter5-windows-complete.json';
                break;
            case '8':
                jsonFile = 'chapter9-operational-procedures-complete.json';
                break;
            case '1':
            default:
                jsonFile = 'Practice_Exam_1_with_answers.json';
                break;
        }

        try {
            const response = await fetch(jsonFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Manejar estructura diferente para el examen 6 (Hardware), 7 (Windows OS) y 8 (Operational Procedures)
            if (examId === '6' || examId === '7' || examId === '8') {
                examenInfo = {
                    title: data.exam ? data.exam.title : data.examInfo.title,
                    totalQuestions: data.exam ? data.exam.totalQuestions : data.examInfo.totalQuestions,
                    timeLimit: data.exam ? data.exam.timerMinutes : data.examInfo.timeLimit,
                    description: data.exam ? `Practice questions for ${data.exam.chapter}.` : data.examInfo.description
                };
            } else {
                examenInfo = data.examInfo;
            }
            
            preguntas = data.questions;
            
            tituloExamenEl.textContent = examenInfo.title;
            respuestasUsuario = new Array(preguntas.length).fill(null);
            
            mostrarPregunta(preguntaActualIdx);
            iniciarTimer(examenInfo.timeLimit, tiempoEl);
        } catch (error) {
            console.error("Error cargando el examen:", error);
            contenedorExamen.innerHTML = `<p style="color: red; font-weight: bold;">Error al cargar el examen. Asegúrate de que el archivo <strong>${jsonFile}</strong> exista y no tenga errores de formato.</p>`;
        }
    }

    function mostrarPregunta(indice) {
        preguntaActualIdx = indice;
        const pregunta = preguntas[indice];
        contenedorExamen.innerHTML = '';

        const textoPregunta = document.createElement('p');
        textoPregunta.className = 'pregunta-texto';
        textoPregunta.textContent = pregunta.question;
        contenedorExamen.appendChild(textoPregunta);
        
        if (pregunta.multipleAnswer) {
            const multipleAnswerNote = document.createElement('p');
            multipleAnswerNote.style.fontStyle = 'italic';
            multipleAnswerNote.style.color = '#555';
            multipleAnswerNote.textContent = `(Elige ${pregunta.correctAnswersCount || 'las opciones correctas'})`;
            contenedorExamen.appendChild(multipleAnswerNote);
        }

        const listaOpciones = document.createElement('ul');
        listaOpciones.className = 'lista-opciones';

        pregunta.options.forEach(opcion => {
            const item = document.createElement('li');
            const inputType = pregunta.multipleAnswer ? 'checkbox' : 'radio';
            const inputName = pregunta.multipleAnswer ? `pregunta-${preguntaActualIdx}-${opcion.id}` : `pregunta-${preguntaActualIdx}`;

            item.innerHTML = `
                <label>
                    <input type="${inputType}" name="${inputName}" value="${opcion.id}">
                    <strong>${opcion.id}.</strong> ${opcion.text}
                </label>
            `;
            listaOpciones.appendChild(item);
        });

        contenedorExamen.appendChild(listaOpciones);

        if (respuestasUsuario[preguntaActualIdx]) {
            respuestasUsuario[preguntaActualIdx].forEach(respuesta => {
                const input = contenedorExamen.querySelector(`input[value="${respuesta}"]`);
                if (input) input.checked = true;
            });
        }

        contadorPreguntaEl.textContent = `Pregunta ${indice + 1} de ${preguntas.length}`;
        actualizarBotones();
    }

    function guardarRespuesta() {
        const pregunta = preguntas[preguntaActualIdx];
        const inputType = pregunta.multipleAnswer ? 'checkbox' : 'radio';
        const selector = `input[name="pregunta-${preguntaActualIdx}"]:checked`;

        if (inputType === 'checkbox') {
            const opcionesSeleccionadas = Array.from(contenedorExamen.querySelectorAll(selector));
            respuestasUsuario[preguntaActualIdx] = opcionesSeleccionadas.map(input => input.value);
        } else {
            const opcionSeleccionada = contenedorExamen.querySelector(selector);
            respuestasUsuario[preguntaActualIdx] = opcionSeleccionada ? [opcionSeleccionada.value] : null;
        }
    }
    
    function sonRespuestasCorrectas(respuestaUsuario, respuestasCorrectas) {
        if (!respuestaUsuario || respuestaUsuario.length !== respuestasCorrectas.length) {
            return false;
        }
        const sortedUser = [...respuestaUsuario].sort();
        const sortedCorrect = [...respuestasCorrectas].sort();
        return sortedUser.every((value, index) => value === sortedCorrect[index]);
    }

    function actualizarBotones() {
        btnAnterior.disabled = preguntaActualIdx === 0;
        btnSiguiente.disabled = preguntaActualIdx === preguntas.length - 1;
    }

    function finalizarExamen() {
        clearInterval(intervaloTimer);
        guardarRespuesta();

        let puntaje = 0;
        preguntas.forEach((pregunta, idx) => {
            if (sonRespuestasCorrectas(respuestasUsuario[idx], pregunta.correctAnswer)) {
                puntaje++;
            }
        });

        const porcentaje = (puntaje / preguntas.length) * 100;
        
        const puntajeMin = 100;
        const puntajeMax = 900;
        const puntajeEscalado = Math.round(puntajeMin + (porcentaje / 100) * (puntajeMax - puntajeMin));

        let puntajeAprobacion;
        switch (examId) {
            case '2':
                puntajeAprobacion = 700;
                break;
            case '3':
                puntajeAprobacion = 700;
                break;
            case '4':
                puntajeAprobacion = 720;
                break;
            case '5':
                puntajeAprobacion = 700;
                break;
            case '6':
                puntajeAprobacion = 675;
                break;
            case '7':
                puntajeAprobacion = 700;
                break;
            case '8':
                puntajeAprobacion = 700;
                break;
            case '1':
            default:
                puntajeAprobacion = 675;
                break;
        }
        
        const aprobado = puntajeEscalado >= puntajeAprobacion;

        resultadoEstadoEl.textContent = aprobado ? '¡APROBADO!' : 'NO APROBADO';
        puntajeEscaladoEl.textContent = `Tu puntaje: ${puntajeEscalado}`;
        puntajeFinalEl.textContent = `(Respuestas correctas: ${puntaje} de ${preguntas.length} - ${porcentaje.toFixed(2)}%)`;
        mensajeFinalEl.textContent = aprobado 
            ? '¡Felicitaciones! Has demostrado tener los conocimientos necesarios.' 
            : '¡No te desanimes! Revisa tus respuestas, estudia los puntos débiles y vuelve a intentarlo.';
        
        resultadoCajaEl.className = 'resultado-final-caja ' + (aprobado ? 'aprobado' : 'no-aprobado');

        mostrarResultadosDetallados();
        
        document.getElementById('contenedor-examen').classList.add('oculto');
        document.querySelector('.navegacion').classList.add('oculto');
        document.getElementById('barra-estado').classList.add('oculto');
        contenedorResultados.classList.remove('oculto');
    }

    function mostrarResultadosDetallados() {
        resultadosDetalladosEl.innerHTML = '';
        preguntas.forEach((pregunta, idx) => {
            const resultadoItem = document.createElement('div');
            resultadoItem.className = 'resultado-item';
            
            const esCorrecto = sonRespuestasCorrectas(respuestasUsuario[idx], pregunta.correctAnswer);
            resultadoItem.classList.add(esCorrecto ? 'correcto' : 'incorrecto');
            
            const respuestaUsuarioTexto = (respuestasUsuario[idx] && respuestasUsuario[idx].length > 0) ? respuestasUsuario[idx].join(', ') : "No respondida";
            const explicacion = preguntas[idx].explanation || "No hay explicación disponible.";

            resultadoItem.innerHTML = `
                <p><strong>Pregunta ${idx + 1}:</strong> ${pregunta.question}</p>
                <p><strong>Tu respuesta:</strong> ${respuestaUsuarioTexto}</p>
                ${!esCorrecto ? `<p><strong>Respuesta correcta:</strong> ${pregunta.correctAnswer.join(', ')}</p>` : ''}
                <p class="explicacion">${explicacion}</p>
            `;
            
            resultadosDetalladosEl.appendChild(resultadoItem);
        });
    }
    
    function iniciarTimer(minutos, display) {
        let tiempo = minutos * 60;
        intervaloTimer = setInterval(() => {
            let min = parseInt(tiempo / 60, 10);
            let seg = parseInt(tiempo % 60, 10);

            min = min < 10 ? "0" + min : min;
            seg = seg < 10 ? "0" + seg : seg;

            display.textContent = `${min}:${seg}`;

            if (--tiempo < 0) {
                clearInterval(intervaloTimer);
                alert("¡Se acabó el tiempo!");
                finalizarExamen();
            }
        }, 1000);
    }

    btnAnterior.addEventListener('click', () => {
        guardarRespuesta();
        if (preguntaActualIdx > 0) {
            mostrarPregunta(preguntaActualIdx - 1);
        }
    });

    btnSiguiente.addEventListener('click', () => {
        guardarRespuesta();
        if (preguntaActualIdx < preguntas.length - 1) {
            mostrarPregunta(preguntaActualIdx + 1);
        }
    });

    btnFinalizar.addEventListener('click', () => {
        const confirmacion = confirm('¿Estás seguro de que quieres finalizar el examen?');
        if (confirmacion) {
            finalizarExamen();
        }
    });

    iniciarExamen();
});