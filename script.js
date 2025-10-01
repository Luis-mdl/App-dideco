// app.js

// Estado global de la aplicación
let demoState = {
    tipoAtencion: '',
    formulario: {},
    entrevista: {
        transcriptMock: [],
        evidencias: []
    },
    evaluacionIA: {
        puntajes: {},
        resumen: '',
        recomendaciones: [],
        alertas: [],
        derivaciones: []
    },
    metadatos: {
        consentimiento: false,
        fecha: ''
    }
};

// Preguntas guionadas por tipo de atención
const preguntasEntrevista = {
    Emprendimiento: [
        '¿Cuál es la motivación principal para su emprendimiento?',
        '¿Qué experiencia previa tiene en el rubro?',
        '¿Cuáles son sus principales desafíos actuales?',
        '¿Cómo visualiza su negocio en 2 años?',
        '¿Qué tipo de apoyo necesita prioritariamente?'
    ],
    OMIL: [
        '¿Por qué le interesa trabajar en este rubro?',
        '¿Cuáles considera sus principales fortalezas laborales?',
        '¿Qué tipo de ambiente laboral prefiere?',
        '¿Tiene alguna restricción de horario o movilidad?',
        '¿Qué expectativas salariales tiene?'
    ],
    Capacitación: [
        '¿Qué lo motiva a capacitarse en esta área?',
        '¿Ha tenido experiencias previas de capacitación?',
        '¿Cómo aprende mejor: práctica, teoría o ambas?',
        '¿Qué espera lograr al finalizar la capacitación?',
        '¿Cuenta con el tiempo necesario para dedicar al estudio?'
    ],
    Conecta: [
        '¿Cuál es su situación actual más urgente?',
        '¿Cuenta con algún tipo de red de apoyo?',
        '¿Ha recibido ayuda de otros programas anteriormente?',
        '¿Cuáles son sus principales barreras para acceder a oportunidades?',
        '¿Qué objetivo le gustaría alcanzar en los próximos 6 meses?'
    ]
};

let preguntaActual = 0;

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Inicializar estado
    resetDemo(false);
    
    // Configurar listeners de navegación
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewId = e.target.dataset.view;
            if (viewId) goTo(viewId);
        });
    });
    
    // Configurar listeners de cards de tipo
    document.querySelectorAll('.card-tipo').forEach(card => {
        card.addEventListener('click', (e) => {
            const tipo = e.currentTarget.dataset.tipo;
            handleTipoSelection(tipo);
        });
    });
    
    // Configurar botones del formulario
    document.getElementById('btn-volver').addEventListener('click', () => goTo('view-inicio'));
    document.getElementById('btn-guardar').addEventListener('click', guardarBorrador);
    document.getElementById('btn-continuar').addEventListener('click', continuarDesdeFormulario);
    
    // Configurar entrevista
    document.getElementById('btn-enviar-chat').addEventListener('click', enviarMensajeChat);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensajeChat();
    });
    document.getElementById('btn-finalizar-entrevista').addEventListener('click', finalizarEntrevista);
    
    // Configurar tabs de criterios
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderCriterios(e.target.dataset.tab);
        });
    });
    
    // Ir a inicio
    goTo('view-inicio');
}

// Manejo de selección de tipo
function handleTipoSelection(tipo) {
    if (demoState.tipoAtencion && demoState.tipoAtencion !== tipo) {
        if (confirm('Ya tiene datos ingresados. ¿Desea reiniciar con el nuevo tipo de atención?')) {
            resetDemo(false);
            setTipoAtencion(tipo);
        }
    } else {
        setTipoAtencion(tipo);
    }
}

// Establecer tipo de atención
function setTipoAtencion(tipo) {
    demoState.tipoAtencion = tipo;
    demoState.metadatos.fecha = new Date().toISOString().split('T')[0];
    goTo('view-formulario');
    renderForm();
}

// Navegación entre vistas
function goTo(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Mostrar la vista solicitada
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        
        // Actualizar navegación activa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === viewId) {
                item.classList.add('active');
            }
        });
        
        // Establecer foco para accesibilidad
        targetView.focus();
    }
}

// Renderizar formulario dinámico
function renderForm() {
    const container = document.getElementById('campos-dinamicos');
    const tipoBadge = document.getElementById('tipo-actual');
    
    tipoBadge.textContent = demoState.tipoAtencion;
    
    let html = '';
    
    // Campos comunes
    html += `
        <fieldset>
            <legend>Identificación</legend>
            <div class="form-group">
                <label for="nombres" class="required">Nombres</label>
                <input type="text" id="nombres" name="nombres" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="apellidos" class="required">Apellidos</label>
                <input type="text" id="apellidos" name="apellidos" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="rut" class="required">RUT/ID</label>
                <input type="text" id="rut" name="rut" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="fechaNacimiento" class="required">Fecha de nacimiento</label>
                <input type="date" id="fechaNacimiento" name="fechaNacimiento" required aria-required="true">
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Contacto</legend>
            <div class="form-group">
                <label for="telefono" class="required">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="email" class="required">Email</label>
                <input type="email" id="email" name="email" required aria-required="true">
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Domicilio</legend>
            <div class="form-group">
                <label for="direccion" class="required">Dirección</label>
                <input type="text" id="direccion" name="direccion" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="comuna" class="required">Comuna</label>
                <input type="text" id="comuna" name="comuna" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="sector" class="required">Sector/Barrio</label>
                <input type="text" id="sector" name="sector" required aria-required="true">
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Situación</legend>
            <div class="form-group">
                <label for="nivelEducacional" class="required">Nivel educacional</label>
                <select id="nivelEducacional" name="nivelEducacional" required aria-required="true">
                    <option value="">Seleccione...</option>
                    <option value="basica-incompleta">Básica incompleta</option>
                    <option value="basica-completa">Básica completa</option>
                    <option value="media-incompleta">Media incompleta</option>
                    <option value="media-completa">Media completa</option>
                    <option value="tecnica-incompleta">Técnica incompleta</option>
                    <option value="tecnica-completa">Técnica completa</option>
                    <option value="universitaria-incompleta">Universitaria incompleta</option>
                    <option value="universitaria-completa">Universitaria completa</option>
                </select>
            </div>
            <div class="form-group">
                <label for="situacionOcupacional" class="required">Situación ocupacional</label>
                <select id="situacionOcupacional" name="situacionOcupacional" required aria-required="true">
                    <option value="">Seleccione...</option>
                    <option value="cesante">Cesante</option>
                    <option value="primer-empleo">Primer empleo</option>
                    <option value="trabajador-activo">Trabajador activo</option>
                    <option value="independiente">Independiente</option>
                </select>
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Información sensible (uso restringido)</legend>
            <p class="text-muted mb-2">Estos datos son opcionales y se usan solo para fines estadísticos</p>
            <div class="form-group">
                <label for="nacionalidad">Nacionalidad</label>
                <input type="text" id="nacionalidad" name="nacionalidad">
            </div>
            <div class="form-group">
                <label for="situacionMigratoria">Situación migratoria</label>
                <select id="situacionMigratoria" name="situacionMigratoria">
                    <option value="">No aplica</option>
                    <option value="regular">Regular</option>
                    <option value="proceso">En proceso</option>
                    <option value="irregular">Irregular</option>
                </select>
            </div>
            <div class="form-group">
                <label for="puebloOriginario">Pueblo originario</label>
                <input type="text" id="puebloOriginario" name="puebloOriginario" placeholder="Opcional">
            </div>
            <div class="form-group">
                <label for="discapacidad">Discapacidad o cuidador</label>
                <select id="discapacidad" name="discapacidad">
                    <option value="">No aplica</option>
                    <option value="fisica">Discapacidad física</option>
                    <option value="sensorial">Discapacidad sensorial</option>
                    <option value="intelectual">Discapacidad intelectual</option>
                    <option value="psiquica">Discapacidad psíquica</option>
                    <option value="cuidador">Soy cuidador/a</option>
                </select>
            </div>
            <div class="form-group">
                <label for="saludCronica">Condición de salud crónica</label>
                <input type="text" id="saludCronica" name="saludCronica" placeholder="Opcional">
            </div>
            <div class="form-group">
                <label for="rsh">Registro Social de Hogares (%)</label>
                <input type="number" id="rsh" name="rsh" min="0" max="100">
            </div>
        </fieldset>
    `;
    
    // Campos específicos según tipo
    if (demoState.tipoAtencion === 'Emprendimiento') {
        html += renderCamposEmprendimiento();
    } else if (demoState.tipoAtencion === 'OMIL') {
        html += renderCamposOMIL();
    } else if (demoState.tipoAtencion === 'Capacitación') {
        html += renderCamposCapacitacion();
    } else if (demoState.tipoAtencion === 'Conecta') {
        html += renderCamposConecta();
    }
    
    // Consentimiento
    html += `
        <fieldset>
            <legend>Consentimiento informado</legend>
            <div class="checkbox-item">
                <input type="checkbox" id="consentimiento" name="consentimiento" required aria-required="true">
                <label for="consentimiento" class="required">
                    Autorizo el uso de mis datos personales para los fines del programa de atención
                </label>
            </div>
        </fieldset>
    `;
    
    container.innerHTML = html;
    
    // Restaurar valores si existen
    restoreFormValues();
    
    // Agregar listeners
    container.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('input', updateStateFromInput);
        element.addEventListener('change', updateStateFromInput);
    });
}

// Renderizar campos específicos de Emprendimiento
function renderCamposEmprendimiento() {
    return `
        <fieldset>
            <legend>Información del Emprendimiento</legend>
            <div class="form-group">
                <label for="estadoEmprendimiento" class="required">Estado del emprendimiento</label>
                <select id="estadoEmprendimiento" name="estadoEmprendimiento" required>
                    <option value="">Seleccione...</option>
                    <option value="idea">Idea</option>
                    <option value="inicio">Inicio</option>
                    <option value="marcha-informal">En marcha informal</option>
                    <option value="marcha-formal">En marcha formal</option>
                </select>
            </div>
            <div class="form-group">
                <label for="rubro" class="required">Rubro/actividad principal</label>
                <input type="text" id="rubro" name="rubro" required>
            </div>
            <div class="form-group">
                <label for="tiempoOperando">Tiempo operando (meses)</label>
                <input type="number" id="tiempoOperando" name="tiempoOperando" min="0">
            </div>
            <div class="form-group">
                <label class="required">Formalización</label>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="formalizacionSII" name="formalizacionSII">
                        <label for="formalizacionSII">Inscrito en SII</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="formalizacionPatente" name="formalizacionPatente">
                        <label for="formalizacionPatente">Con patente municipal</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="ventasPromedio">Ventas promedio mensual</label>
                <select id="ventasPromedio" name="ventasPromedio">
                    <option value="">Seleccione...</option>
                    <option value="0-100000">$0 - $100.000</option>
                    <option value="100001-500000">$100.001 - $500.000</option>
                    <option value="500001-1000000">$500.001 - $1.000.000</option>
                    <option value="1000001-3000000">$1.000.001 - $3.000.000</option>
                    <option value="3000001+">Más de $3.000.000</option>
                </select>
            </div>
            <div class="form-group">
                <label>Necesidades principales</label>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="necFinanciamiento" name="necFinanciamiento">
                        <label for="necFinanciamiento">Financiamiento</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="necFormalizacion" name="necFormalizacion">
                        <label for="necFormalizacion">Formalización</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="necMarketing" name="necMarketing">
                        <label for="necMarketing">Marketing</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="necOperaciones" name="necOperaciones">
                        <label for="necOperaciones">Operaciones</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="necDigitalizacion" name="necDigitalizacion">
                        <label for="necDigitalizacion">Digitalización</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="presenciaDigital">Presencia digital (URL)</label>
                <input type="text" id="presenciaDigital" name="presenciaDigital" placeholder="www.ejemplo.com">
            </div>
            <div class="form-group">
                <label>Interés en instrumentos</label>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="intSERCOTEC" name="intSERCOTEC">
                        <label for="intSERCOTEC">SERCOTEC</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="intCORFO" name="intCORFO">
                        <label for="intCORFO">CORFO</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="intFOIS" name="intFOIS">
                        <label for="intFOIS">FOIS</label>
                    </div>
                </div>
            </div>
        </fieldset>
    `;
}

// Renderizar campos específicos de OMIL
function renderCamposOMIL() {
    return `
        <fieldset>
            <legend>Objetivo Laboral</legend>
            <div class="form-group">
                <label for="cargoBuscado" class="required">Cargo/oficio buscado</label>
                <input type="text" id="cargoBuscado" name="cargoBuscado" required>
            </div>
            <div class="form-group">
                <label for="rubrosInteres" class="required">Rubro(s) de interés</label>
                <input type="text" id="rubrosInteres" name="rubrosInteres" required placeholder="Ej: Retail, Construcción, Servicios">
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Experiencia Laboral</legend>
            <div class="form-group">
                <label for="exp1Empresa">Empleo 1 - Empresa</label>
                <input type="text" id="exp1Empresa" name="exp1Empresa">
            </div>
            <div class="form-group">
                <label for="exp1Cargo">Empleo 1 - Cargo</label>
                <input type="text" id="exp1Cargo" name="exp1Cargo">
            </div>
            <div class="form-group">
                <label for="exp1Periodo">Empleo 1 - Período</label>
                <input type="text" id="exp1Periodo" name="exp1Periodo" placeholder="Ej: 2020-2022">
            </div>
            <div class="form-group">
                <label for="exp1Funciones">Empleo 1 - Funciones principales</label>
                <textarea id="exp1Funciones" name="exp1Funciones" rows="3"></textarea>
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Competencias</legend>
            <div class="form-group">
                <label for="competenciasTecnicas">Competencias técnicas</label>
                <textarea id="competenciasTecnicas" name="competenciasTecnicas" rows="2" placeholder="Ej: Excel, Soldadura, Atención al cliente"></textarea>
            </div>
            <div class="form-group">
                <label>Competencias blandas</label>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="compComunicacion" name="compComunicacion">
                        <label for="compComunicacion">Comunicación</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="compEquipo" name="compEquipo">
                        <label for="compEquipo">Trabajo en equipo</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="compProblemas" name="compProblemas">
                        <label for="compProblemas">Resolución de problemas</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="compResponsabilidad" name="compResponsabilidad">
                        <label for="compResponsabilidad">Responsabilidad</label>
                    </div>
                </div>
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Disponibilidad</legend>
            <div class="form-group">
                <label for="jornada" class="required">Jornada preferida</label>
                <select id="jornada" name="jornada" required>
                    <option value="">Seleccione...</option>
                    <option value="completa">Completa</option>
                    <option value="parcial">Parcial</option>
                    <option value="por-turnos">Por turnos</option>
                    <option value="flexible">Flexible</option>
                </select>
            </div>
            <div class="form-group">
                <label for="movilidad" class="required">Movilidad</label>
                <select id="movilidad" name="movilidad" required>
                    <option value="">Seleccione...</option>
                    <option value="propia">Propia</option>
                    <option value="transporte-publico">Transporte público</option>
                    <option value="limitada">Limitada</option>
                </select>
            </div>
            <div class="form-group">
                <label for="pretensionRenta" class="required">Pretensión de renta</label>
                <select id="pretensionRenta" name="pretensionRenta" required>
                    <option value="">Seleccione...</option>
                    <option value="minimo">Salario mínimo</option>
                    <option value="450000-600000">$450.000 - $600.000</option>
                    <option value="600001-800000">$600.001 - $800.000</option>
                    <option value="800001-1000000">$800.001 - $1.000.000</option>
                    <option value="1000001+">Más de $1.000.000</option>
                </select>
            </div>
        </fieldset>
    `;
}

// Renderizar campos específicos de Capacitación
function renderCamposCapacitacion() {
    return `
        <fieldset>
            <legend>Intereses de Capacitación</legend>
            <div class="form-group">
                <label class="required">Áreas de interés</label>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="intOS10" name="intOS10">
                        <label for="intOS10">OS-10</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="intGrua" name="intGrua">
                        <label for="intGrua">Grúa horquilla</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="intElectricidad" name="intElectricidad">
                        <label for="intElectricidad">Electricidad</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="intSoldadura" name="intSoldadura">
                        <label for="intSoldadura">Soldadura</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="intAlfabetizacion" name="intAlfabetizacion">
                        <label for="intAlfabetizacion">Alfabetización digital</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="intOfimatica" name="intOfimatica">
                        <label for="intOfimatica">Ofimática</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="intAtencion" name="intAtencion">
                        <label for="intAtencion">Atención al cliente</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="intOtro">Otro interés de capacitación</label>
                <input type="text" id="intOtro" name="intOtro">
            </div>
            <div class="form-group">
                <label for="nivelBase" class="required">Nivel de conocimiento base</label>
                <select id="nivelBase" name="nivelBase" required>
                    <option value="">Seleccione...</option>
                    <option value="sin-experiencia">Sin experiencia</option>
                    <option value="basico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                </select>
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Disponibilidad para Capacitación</legend>
            <div class="form-group">
                <label for="diasDisponibles" class="required">Días disponibles</label>
                <input type="text" id="diasDisponibles" name="diasDisponibles" required placeholder="Ej: Lunes a viernes">
            </div>
            <div class="form-group">
                <label for="horariosDisponibles" class="required">Horarios disponibles</label>
                <input type="text" id="horariosDisponibles" name="horariosDisponibles" required placeholder="Ej: Mañana, Tarde">
            </div>
            <div class="form-group">
                <label for="modalidadPreferida" class="required">Modalidad preferida</label>
                <select id="modalidadPreferida" name="modalidadPreferida" required>
                    <option value="">Seleccione...</option>
                    <option value="presencial">Presencial</option>
                    <option value="online">Online</option>
                    <option value="hibrida">Híbrida</option>
                </select>
            </div>
            <div class="form-group">
                <label>Equipamiento disponible</label>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="equipoPC" name="equipoPC">
                        <label for="equipoPC">Computador/Notebook</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="equipoInternet" name="equipoInternet">
                        <label for="equipoInternet">Internet estable</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="equipoSmartphone" name="equipoSmartphone">
                        <label for="equipoSmartphone">Smartphone</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="certificacionesPrevias">Certificaciones previas</label>
                <textarea id="certificacionesPrevias" name="certificacionesPrevias" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label for="objetivoFinal" class="required">Objetivo al finalizar la capacitación</label>
                <textarea id="objetivoFinal" name="objetivoFinal" rows="2" required></textarea>
            </div>
        </fieldset>
    `;
}

// Renderizar campos específicos de Conecta
function renderCamposConecta() {
    return `
        <fieldset>
            <legend>Situación y Barreras</legend>
            <div class="form-group">
                <label for="cuidadoTerceros" class="required">¿Tiene personas a su cuidado?</label>
                <select id="cuidadoTerceros" name="cuidadoTerceros" required>
                    <option value="">Seleccione...</option>
                    <option value="no">No</option>
                    <option value="hijos-menores">Hijos menores</option>
                    <option value="adulto-mayor">Adulto mayor</option>
                    <option value="persona-discapacidad">Persona con discapacidad</option>
                    <option value="multiple">Múltiples personas</option>
                </select>
            </div>
            <div class="form-group">
                <label for="horariosDisponiblesConecta" class="required">Horarios disponibles</label>
                <input type="text" id="horariosDisponiblesConecta" name="horariosDisponiblesConecta" required>
            </div>
            <div class="form-group">
                <label for="transporte" class="required">Acceso a transporte</label>
                <select id="transporte" name="transporte" required>
                    <option value="">Seleccione...</option>
                    <option value="propio">Vehículo propio</option>
                    <option value="publico">Transporte público</option>
                    <option value="limitado">Acceso limitado</option>
                    <option value="sin-acceso">Sin acceso</option>
                </select>
            </div>
            <div class="form-group">
                <label for="accesoTecnologia" class="required">Acceso a tecnología</label>
                <select id="accesoTecnologia" name="accesoTecnologia" required>
                    <option value="">Seleccione...</option>
                    <option value="completo">Computador e internet</option>
                    <option value="smartphone">Solo smartphone</option>
                    <option value="limitado">Acceso limitado</option>
                    <option value="sin-acceso">Sin acceso</option>
                </select>
            </div>
        </fieldset>
        
        <fieldset>
            <legend>Objetivos y Apoyo</legend>
            <div class="form-group">
                <label class="required">Objetivos principales</label>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="objEmpleo" name="objEmpleo">
                        <label for="objEmpleo">Encontrar empleo</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="objCapacitacion" name="objCapacitacion">
                        <label for="objCapacitacion">Capacitación</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="objEmprendimiento" name="objEmprendimiento">
                        <label for="objEmprendimiento">Emprendimiento</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="objApoyo" name="objApoyo">
                        <label for="objApoyo">Apoyo social</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="detalleObjetivos" class="required">Detalle de objetivos</label>
                <textarea id="detalleObjetivos" name="detalleObjetivos" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label for="redesApoyo">Redes de apoyo disponibles</label>
                <textarea id="redesApoyo" name="redesApoyo" rows="2" placeholder="Familia, amigos, organizaciones, etc."></textarea>
            </div>
            <div class="form-group">
                <label for="derivacionesPrevias">Derivaciones o programas previos</label>
                <textarea id="derivacionesPrevias" name="derivacionesPrevias" rows="2"></textarea>
            </div>
        </fieldset>
    `;
}

// Actualizar estado desde inputs
function updateStateFromInput(event) {
    const element = event.target;
    const name = element.name;
    const value = element.type === 'checkbox' ? element.checked : element.value;
    
    demoState.formulario[name] = value;
    
    // Actualizar consentimiento en metadatos
    if (name === 'consentimiento') {
        demoState.metadatos.consentimiento = value;
    }
    
    // Validar formulario en tiempo real
    validateForm();
}

// Restaurar valores del formulario desde el estado
function restoreFormValues() {
    Object.keys(demoState.formulario).forEach(key => {
        const element = document.querySelector(`[name="${key}"]`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = demoState.formulario[key];
            } else {
                element.value = demoState.formulario[key];
            }
        }
    });
}

// Validar formulario
function validateForm() {
    const btnContinuar = document.getElementById('btn-continuar');
    const errorContainer = document.getElementById('error-messages');
    const errors = [];
    
    // Validar campos requeridos
    const requiredFields = document.querySelectorAll('[required]');
    let allValid = true;
    
    requiredFields.forEach(field => {
        if (field.type === 'checkbox') {
            if (!field.checked) {
                allValid = false;
                field.classList.add('error');
                if (field.name === 'consentimiento') {
                    errors.push('Debe aceptar el consentimiento informado');
                }
            } else {
                field.classList.remove('error');
            }
        } else if (!field.value.trim()) {
            allValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });
    
    // Validaciones específicas
    const email = document.getElementById('email');
    if (email && email.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            allValid = false;
            email.classList.add('error');
            errors.push('Email inválido');
        }
    }
    
    const telefono = document.getElementById('telefono');
    if (telefono && telefono.value) {
        if (telefono.value.replace(/\D/g, '').length < 8) {
            allValid = false;
            telefono.classList.add('error');
            errors.push('Teléfono debe tener al menos 8 dígitos');
        }
    }
    
    // Validaciones específicas por tipo
    if (demoState.tipoAtencion === 'Capacitación') {
        const checkboxes = document.querySelectorAll('[name^="int"]:checked');
        if (checkboxes.length === 0 && !document.getElementById('intOtro').value) {
            allValid = false;
            errors.push('Debe seleccionar al menos un área de interés');
        }
    }
    
    // Actualizar UI
    btnContinuar.disabled = !allValid;
    
    if (errors.length > 0) {
        errorContainer.innerHTML = errors.map(e => `<div>${e}</div>`).join('');
        errorContainer.style.display = 'block';
    } else {
        errorContainer.style.display = 'none';
    }
    
    return allValid;
}

// Guardar borrador
function guardarBorrador() {
    // Los datos ya están en demoState gracias a updateStateFromInput
    alert('Borrador guardado en memoria');
}

// Continuar desde formulario
function continuarDesdeFormulario() {
    if (validateForm()) {
        // Guardar evidencia
        demoState.entrevista.evidencias.push({
            fuente: 'formulario',
            timestamp: new Date().toISOString(),
            datos: {...demoState.formulario}
        });
        
        // Inicializar entrevista
        preguntaActual = 0;
        iniciarEntrevista();
        goTo('view-entrevista');
    }
}

// Iniciar entrevista
function iniciarEntrevista() {
    renderCriterios('comun');
    
    // Agregar primera pregunta
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = `
        <div class="message agent">Bienvenido ${demoState.formulario.nombres || 'a la entrevista'}. Vamos a profundizar en su situación.</div>
        <div class="message agent">${preguntasEntrevista[demoState.tipoAtencion][preguntaActual]}</div>
    `;
}

// Renderizar criterios de evaluación
function renderCriterios(tipo) {
    const container = document.getElementById('criterios-list');
    let criterios = [];
    
    if (tipo === 'comun') {
        criterios = [
            { nombre: 'Datos de identificación', estado: demoState.formulario.nombres ? 'cubierto' : 'pendiente' },
            { nombre: 'Información de contacto', estado: demoState.formulario.email ? 'cubierto' : 'pendiente' },
            { nombre: 'Situación ocupacional', estado: demoState.formulario.situacionOcupacional ? 'cubierto' : 'pendiente' },
            { nombre: 'Consentimiento', estado: demoState.metadatos.consentimiento ? 'cubierto' : 'alerta' }
        ];
    } else {
        // Criterios específicos por tipo
        switch (demoState.tipoAtencion) {
            case 'Emprendimiento':
                criterios = [
                    { nombre: 'Estado del negocio', estado: demoState.formulario.estadoEmprendimiento ? 'cubierto' : 'pendiente' },
                    { nombre: 'Formalización', estado: demoState.formulario.formalizacionSII ? 'cubierto' : 'pendiente' },
                    { nombre: 'Necesidades identificadas', estado: 'pendiente' }
                ];
                break;
            case 'OMIL':
                criterios = [
                    { nombre: 'Objetivo laboral', estado: demoState.formulario.cargoBuscado ? 'cubierto' : 'pendiente' },
                    { nombre: 'Experiencia relevante', estado: demoState.formulario.exp1Empresa ? 'cubierto' : 'pendiente' },
                    { nombre: 'Disponibilidad', estado: demoState.formulario.jornada ? 'cubierto' : 'pendiente' }
                ];
                break;
            case 'Capacitación':
                criterios = [
                    { nombre: 'Intereses definidos', estado: 'pendiente' },
                    { nombre: 'Disponibilidad horaria', estado: demoState.formulario.diasDisponibles ? 'cubierto' : 'pendiente' },
                    { nombre: 'Equipamiento', estado: 'pendiente' }
                ];
                break;
            case 'Conecta':
                criterios = [
                    { nombre: 'Barreras identificadas', estado: demoState.formulario.cuidadoTerceros ? 'cubierto' : 'pendiente' },
                    { nombre: 'Objetivos claros', estado: demoState.formulario.detalleObjetivos ? 'cubierto' : 'pendiente' },
                    { nombre: 'Red de apoyo', estado: 'pendiente' }
                ];
                break;
        }
    }
    
    container.innerHTML = criterios.map(c => `
        <div class="criterio-item">
            <span>${c.nombre}</span>
            <span class="criterio-badge badge-${c.estado}">${c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}</span>
        </div>
    `).join('');
}

// Enviar mensaje en el chat
function enviarMensajeChat() {
    const input = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!input.value.trim()) return;
    
    // Agregar respuesta del usuario
    chatMessages.innerHTML += `<div class="message user">${input.value}</div>`;
    
    // Guardar en transcript
    demoState.entrevista.transcriptMock.push({
        timestamp: new Date().toISOString(),
        tipo: 'user',
        mensaje: input.value
    });
    
    // Limpiar input
    input.value = '';
    
    // Siguiente pregunta o finalizar
    preguntaActual++;
    if (preguntaActual < preguntasEntrevista[demoState.tipoAtencion].length) {
        setTimeout(() => {
            const pregunta = preguntasEntrevista[demoState.tipoAtencion][preguntaActual];
            chatMessages.innerHTML += `<div class="message agent">${pregunta}</div>`;
            demoState.entrevista.transcriptMock.push({
                timestamp: new Date().toISOString(),
                tipo: 'agent',
                mensaje: pregunta
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    } else {
        setTimeout(() => {
            chatMessages.innerHTML += `<div class="message agent">Gracias por sus respuestas. Puede finalizar la entrevista cuando esté listo.</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
    
    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Finalizar entrevista y generar evaluación
function finalizarEntrevista() {
    // Generar evaluación IA simulada
    generarEvaluacionIA();
    
    // Guardar evidencia de entrevista
    demoState.entrevista.evidencias.push({
        fuente: 'entrevista',
        timestamp: new Date().toISOString(),
        transcript: demoState.entrevista.transcriptMock
    });
    
    // Navegar a perfil
    goTo('view-perfil');
    renderPerfil();
}

// Generar evaluación IA (simulada)
function generarEvaluacionIA() {
    const form = demoState.formulario;
    
    // Calcular puntajes basados en los datos del formulario
    let puntajes = {
        tecnicas: 3,
        blandas: 3,
        experiencia: 3,
        disponibilidad: 3
    };
    
    // Lógica de puntajes según tipo de atención
    switch (demoState.tipoAtencion) {
        case 'Emprendimiento':
            // Técnicas basadas en estado y formalización
            if (form.estadoEmprendimiento === 'marcha-formal') puntajes.tecnicas = 5;
            else if (form.estadoEmprendimiento === 'marcha-informal') puntajes.tecnicas = 4;
            else if (form.estadoEmprendimiento === 'inicio') puntajes.tecnicas = 3;
            else puntajes.tecnicas = 2;
            
            // Experiencia basada en tiempo operando
            if (form.tiempoOperando > 24) puntajes.experiencia = 5;
            else if (form.tiempoOperando > 12) puntajes.experiencia = 4;
            else if (form.tiempoOperando > 6) puntajes.experiencia = 3;
            else puntajes.experiencia = 2;
            break;
            
        case 'OMIL':
            // Técnicas basadas en competencias
            if (form.competenciasTecnicas && form.competenciasTecnicas.split(',').length > 3) {
                puntajes.tecnicas = 5;
            } else if (form.competenciasTecnicas) {
                puntajes.tecnicas = 3;
            }
            
            // Experiencia basada en empleos previos
            if (form.exp1Empresa) puntajes.experiencia = 4;
            
            // Disponibilidad basada en jornada y movilidad
            if (form.jornada === 'completa' && form.movilidad === 'propia') {
                puntajes.disponibilidad = 5;
            } else if (form.jornada === 'flexible') {
                puntajes.disponibilidad = 4;
            }
            break;
            
        case 'Capacitación':
            // Técnicas basadas en nivel base
            if (form.nivelBase === 'avanzado') puntajes.tecnicas = 5;
            else if (form.nivelBase === 'intermedio') puntajes.tecnicas = 4;
            else if (form.nivelBase === 'basico') puntajes.tecnicas = 3;
            else puntajes.tecnicas = 2;
            
            // Disponibilidad basada en equipamiento
            if (form.equipoPC && form.equipoInternet) puntajes.disponibilidad = 5;
            else if (form.equipoSmartphone) puntajes.disponibilidad = 3;
            else puntajes.disponibilidad = 2;
            break;
            
        case 'Conecta':
            // Evaluación basada en barreras
            if (form.cuidadoTerceros === 'no') puntajes.disponibilidad = 4;
            else puntajes.disponibilidad = 2;
            
            if (form.accesoTecnologia === 'completo') puntajes.tecnicas = 4;
            else if (form.accesoTecnologia === 'smartphone') puntajes.tecnicas = 3;
            else puntajes.tecnicas = 2;
            break;
    }
    
    // Blandas basadas en checkboxes seleccionados
    const blandas = ['compComunicacion', 'compEquipo', 'compProblemas', 'compResponsabilidad'];
    const blandasCount = blandas.filter(b => form[b]).length;
    puntajes.blandas = Math.min(5, blandasCount + 2);
    
    // Calcular empleabilidad
    puntajes.empleabilidad = ((puntajes.tecnicas + puntajes.blandas + puntajes.experiencia + puntajes.disponibilidad) / 4).toFixed(1);
    
    // Generar resumen ejecutivo
    const resumen = `${form.nombres} ${form.apellidos} busca ${
        demoState.tipoAtencion === 'OMIL' ? `trabajo como ${form.cargoBuscado || 'operario'}` :
        demoState.tipoAtencion === 'Emprendimiento' ? `apoyo para su emprendimiento de ${form.rubro || 'servicios'}` :
        demoState.tipoAtencion === 'Capacitación' ? `capacitación en el área seleccionada` :
        'apoyo integral y orientación'
    }. ${form.situacionOcupacional === 'cesante' ? 'Actualmente cesante.' : 
        form.situacionOcupacional === 'independiente' ? 'Trabajador independiente.' : 
        'En búsqueda activa.'} Evaluación de empleabilidad: ${puntajes.empleabilidad}/5.`;
    
    // Generar recomendaciones
    const recomendaciones = [];
    
    if (puntajes.tecnicas < 3) {
        recomendaciones.push('Se recomienda capacitación técnica para mejorar competencias específicas');
    }
    if (puntajes.experiencia < 3) {
        recomendaciones.push('Considerar programas de práctica o primera experiencia laboral');
    }
    if (puntajes.disponibilidad < 3) {
        recomendaciones.push('Evaluar alternativas para mejorar disponibilidad horaria o movilidad');
    }
    
    // Generar derivaciones
    const derivaciones = [];
    
    if (demoState.tipoAtencion === 'OMIL') {
        derivaciones.push({ programa: 'Bolsa de empleo', motivo: 'Búsqueda activa de trabajo' });
        if (puntajes.tecnicas < 3) {
            derivaciones.push({ programa: 'Capacitación', motivo: 'Fortalecer competencias técnicas' });
        }
    } else if (demoState.tipoAtencion === 'Emprendimiento') {
        if (form.estadoEmprendimiento === 'idea' || form.estadoEmprendimiento === 'inicio') {
            derivaciones.push({ programa: 'SERCOTEC', motivo: 'Apoyo en etapa inicial' });
        }
        if (!form.formalizacionSII) {
            derivaciones.push({ programa: 'Formalización', motivo: 'Regularizar situación tributaria' });
        }
    } else if (demoState.tipoAtencion === 'Capacitación') {
        derivaciones.push({ programa: 'SENCE', motivo: 'Acceso a cursos certificados' });
    } else if (demoState.tipoAtencion === 'Conecta') {
        if (form.objEmpleo) {
            derivaciones.push({ programa: 'OMIL', motivo: 'Objetivo de empleo identificado' });
        }
        if (form.objCapacitacion) {
            derivaciones.push({ programa: 'Capacitación', motivo: 'Interés en formación' });
        }
    }
    
    // Generar alertas
    const alertas = [];
    
    if (!form.consentimiento) {
        alertas.push('Falta consentimiento informado para procesar datos');
    }
    if (!form.email && !form.telefono) {
        alertas.push('Sin datos de contacto válidos');
    }
    if (form.discapacidad && form.discapacidad !== '') {
        alertas.push('Persona con discapacidad o cuidador - requiere atención especializada');
    }
    
    // Guardar en estado
    demoState.evaluacionIA = {
        puntajes,
        resumen,
        recomendaciones,
        alertas,
        derivaciones
    };
}

// Renderizar perfil
function renderPerfil() {
    const container = document.getElementById('perfil-content');
    const form = demoState.formulario;
    const evaluacion = demoState.evaluacionIA;
    
    let html = `
        <!-- Encabezado -->
        <div class="perfil-encabezado">
            <div>
                <h3>${form.nombres || 'Sin nombre'} ${form.apellidos || ''}</h3>
                <p class="text-muted">RUT/ID: ${form.rut || 'No registrado'}</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <span class="tipo-badge">${demoState.tipoAtencion}</span>
                <span class="estado-badge">En evaluación</span>
            </div>
        </div>
        
        <!-- Resumen ejecutivo -->
        <div class="perfil-section">
            <h4>Resumen Ejecutivo</h4>
            <p>${evaluacion.resumen}</p>
        </div>
        
        <!-- Puntajes -->
        <div class="perfil-section">
            <h4>Evaluación de Competencias</h4>
            <div class="puntajes-grid">
                <div class="puntaje-item">
                    <div class="puntaje-label">Empleabilidad General</div>
                    <div class="puntaje-valor">${evaluacion.puntajes.empleabilidad}</div>
                    <div class="puntaje-barra">
                        <div class="puntaje-progreso" style="width: ${evaluacion.puntajes.empleabilidad * 20}%"></div>
                    </div>
                </div>
                <div class="puntaje-item">
                    <div class="puntaje-label">Competencias Técnicas</div>
                    <div class="puntaje-valor">${evaluacion.puntajes.tecnicas}</div>
                    <div class="puntaje-barra">
                        <div class="puntaje-progreso" style="width: ${evaluacion.puntajes.tecnicas * 20}%"></div>
                    </div>
                </div>
                <div class="puntaje-item">
                    <div class="puntaje-label">Habilidades Blandas</div>
                    <div class="puntaje-valor">${evaluacion.puntajes.blandas}</div>
                    <div class="puntaje-barra">
                        <div class="puntaje-progreso" style="width: ${evaluacion.puntajes.blandas * 20}%"></div>
                    </div>
                </div>
                <div class="puntaje-item">
                    <div class="puntaje-label">Experiencia</div>
                    <div class="puntaje-valor">${evaluacion.puntajes.experiencia}</div>
                    <div class="puntaje-barra">
                        <div class="puntaje-progreso" style="width: ${evaluacion.puntajes.experiencia * 20}%"></div>
                    </div>
                </div>
                <div class="puntaje-item">
                    <div class="puntaje-label">Disponibilidad</div>
                    <div class="puntaje-valor">${evaluacion.puntajes.disponibilidad}</div>
                    <div class="puntaje-barra">
                        <div class="puntaje-progreso" style="width: ${evaluacion.puntajes.disponibilidad * 20}%"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Datos personales -->
        <div class="perfil-section">
            <h4>Datos Personales</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                <div>
                    <strong>Fecha de nacimiento:</strong> ${form.fechaNacimiento || 'No registrado'}
                </div>
                <div>
                    <strong>Teléfono:</strong> ${form.telefono || 'No registrado'}
                </div>
                <div>
                    <strong>Email:</strong> ${form.email || 'No registrado'}
                </div>
                <div>
                    <strong>Dirección:</strong> ${form.direccion || 'No registrado'}
                </div>
                <div>
                    <strong>Comuna:</strong> ${form.comuna || 'No registrado'}
                </div>
                <div>
                    <strong>Nivel educacional:</strong> ${form.nivelEducacional || 'No registrado'}
                </div>
                <div>
                    <strong>Situación ocupacional:</strong> ${form.situacionOcupacional || 'No registrado'}
                </div>
            </div>
        </div>
    `;
    
    // Sección específica según tipo
    if (demoState.tipoAtencion === 'OMIL') {
        html += `
            <div class="perfil-section">
                <h4>Objetivo Laboral</h4>
                <p><strong>Cargo buscado:</strong> ${form.cargoBuscado || 'No especificado'}</p>
                <p><strong>Rubros de interés:</strong> ${form.rubrosInteres || 'No especificado'}</p>
                <p><strong>Pretensión de renta:</strong> ${form.pretensionRenta || 'No especificado'}</p>
                <p><strong>Jornada preferida:</strong> ${form.jornada || 'No especificado'}</p>
            </div>
        `;
    } else if (demoState.tipoAtencion === 'Emprendimiento') {
        html += `
            <div class="perfil-section">
                <h4>Información del Emprendimiento</h4>
                <p><strong>Estado:</strong> ${form.estadoEmprendimiento || 'No especificado'}</p>
                <p><strong>Rubro:</strong> ${form.rubro || 'No especificado'}</p>
                <p><strong>Tiempo operando:</strong> ${form.tiempoOperando || '0'} meses</p>
                <p><strong>Ventas mensuales:</strong> ${form.ventasPromedio || 'No especificado'}</p>
                <p><strong>Formalización SII:</strong> ${form.formalizacionSII ? 'Sí' : 'No'}</p>
                <p><strong>Patente municipal:</strong> ${form.formalizacionPatente ? 'Sí' : 'No'}</p>
            </div>
        `;
    } else if (demoState.tipoAtencion === 'Capacitación') {
        html += `
            <div class="perfil-section">
                <h4>Intereses de Capacitación</h4>
                <p><strong>Nivel base:</strong> ${form.nivelBase || 'No especificado'}</p>
                <p><strong>Modalidad preferida:</strong> ${form.modalidadPreferida || 'No especificado'}</p>
                <p><strong>Días disponibles:</strong> ${form.diasDisponibles || 'No especificado'}</p>
                <p><strong>Objetivo al finalizar:</strong> ${form.objetivoFinal || 'No especificado'}</p>
            </div>
        `;
    } else if (demoState.tipoAtencion === 'Conecta') {
        html += `
            <div class="perfil-section">
                <h4>Situación y Objetivos</h4>
                <p><strong>Personas a cargo:</strong> ${form.cuidadoTerceros || 'No especificado'}</p>
                <p><strong>Acceso a transporte:</strong> ${form.transporte || 'No especificado'}</p>
                <p><strong>Acceso a tecnología:</strong> ${form.accesoTecnologia || 'No especificado'}</p>
                <p><strong>Objetivos:</strong> ${form.detalleObjetivos || 'No especificado'}</p>
            </div>
        `;
    }
    
    // Recomendaciones y derivaciones
    html += `
        <div class="perfil-section">
            <h4>Recomendaciones</h4>
            ${evaluacion.recomendaciones.length > 0 ? 
                '<ul>' + evaluacion.recomendaciones.map(r => `<li>${r}</li>`).join('') + '</ul>' :
                '<p class="text-muted">No hay recomendaciones específicas</p>'
            }
        </div>
        
        <div class="perfil-section">
            <h4>Derivaciones Sugeridas</h4>
            ${evaluacion.derivaciones.length > 0 ?
                '<ul>' + evaluacion.derivaciones.map(d => `<li><strong>${d.programa}:</strong> ${d.motivo}</li>`).join('') + '</ul>' :
                '<p class="text-muted">No se sugieren derivaciones</p>'
            }
        </div>
    `;
    
    // Alertas si existen
    if (evaluacion.alertas.length > 0) {
        html += `
            <div class="perfil-section">
                <h4>Alertas y Observaciones</h4>
                ${evaluacion.alertas.map(a => `<div class="alert-box alert-warning">${a}</div>`).join('')}
            </div>
        `;
    }
    
    // Trazabilidad
    html += `
        <div class="perfil-section">
            <h4>Trazabilidad</h4>
            <p class="text-muted">Registro creado: ${demoState.metadatos.fecha}</p>
            <p class="text-muted">Evidencias recopiladas: ${demoState.entrevista.evidencias.length} fuentes</p>
            <ul>
                ${demoState.entrevista.evidencias.map(e => 
                    `<li>Fuente: ${e.fuente} - ${new Date(e.timestamp).toLocaleString()}</li>`
                ).join('')}
            </ul>
        </div>
    `;
    
    container.innerHTML = html;
}

// Resetear demo
function resetDemo(askConfirm = true) {
    if (askConfirm && !confirm('¿Está seguro de reiniciar todos los datos?')) {
        return;
    }
    
    demoState = {
        tipoAtencion: '',
        formulario: {},
        entrevista: {
            transcriptMock: [],
            evidencias: []
        },
        evaluacionIA: {
            puntajes: {},
            resumen: '',
            recomendaciones: [],
            alertas: [],
            derivaciones: []
        },
        metadatos: {
            consentimiento: false,
            fecha: ''
        }
    };
    
    preguntaActual = 0;
}
