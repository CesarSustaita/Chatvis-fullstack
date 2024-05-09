/**
 * This file contains the main JavaScript code for Semantic ChatVis with Flask.
 * It includes global variables, functions for handling file input, data parsing, chart generation, and auxiliary functions.
 * The code is divided into sections for functions without animations, functions with animations, and auxiliary functions.
 * 
 * @file FILEPATH: /Semantic-ChatVis-with-Flask/app/static/js/main.js
 * @global
 * @namespace
 */

//import * as d3 from "d3";
var prefix = "chatvis2024";

////prueba
function sendFileNameToMainJs(fileName) {
    // Aquí puedes hacer lo que quieras con el nombre del archivo
    console.log('El nombre del archivo seleccionado es: ' + fileName);
    // Por ejemplo, puedes pasarlo a otra función o realizar algún otro procesamiento.
}


// Variables globales

// Mensaje de error al cargar el archivo
// Imprimir mensajes en consola

var input = document.getElementById("whatsChat");
var inputSA = document.getElementById("whatsChatSinAnimaciones");


var reader = new FileReader();
var readerSA = new FileReader();

var messages_data = [];
var uniqueContacts;

// Colores
var colors = [
	"#ff7400", "#7ceac9", "#57abe4", "#262043", "#a74949",
	"#7da557", "#a74949", "#eed27a", "#60b28f", "#e7a7b1",
	"#301E1E", "#083E77", "#342350", "#567235", "#8B161C",
	"#DF7C00", "#00BCD4", "#F26623", "#C6DE89", "#FFB52A"
];

// Variables de fechas
const today = new Date();
const today_day = today.getDate();
const today_month = today.getMonth();
const today_year = today.getFullYear();

// Variables para el diagrama Chord
var relationships = [];


// ************************************************************
// ************************************************************
//                  Funciones sin animaciones
// ************************************************************
// ************************************************************

/**
 * Esta función se ejecuta cuando el usuario selecciona un archivo.
 * Se encarga de verificar que el archivo sea de tipo .txt y de cargarlo.
 * 
 */
inputSA.addEventListener("change", function () {
	if (this.files && this.files[0]) {
		var whatsChat = this.files[0];

		// Check if file is .txt
		if (whatsChat.type != "text/plain") {
			swal("Error", "El archivo debe ser de tipo .txt", "error");
			this.value = '';
			return;
		}
	swal("Cargado correctamente", "El archivo se ha cargado correctamente.", "success");
       // window.location.href = '/';
		// Loads the file, triggering the event
		readerSA.readAsText(whatsChat, 'UTF-8');
	};
});

// Cuando se carga el archivo se ejecuta esta funcion
/**
 * Esta función se ejecuta cuando se carga el archivo.
 * Se encarga de parsear los datos como mensajes de whatsapp.
 * 
 */
readerSA.addEventListener('load', function (e) {
	try {
		messages_data = whatsappChatParser.parseString(e.target.result);
	} catch (err) {
		console.log(err);
	}
});

// Cuando se termina de cargar el archivo se ejecuta esta funcion
/**
 * Esta función se ejecuta cuando se termina de leer el archivo.
 * Se encarga de procesar los datos y generar los gráficos.
 * 
 */
readerSA.addEventListener('loadend', function (e) {
	console.clear();
	showAppElements();
	// Check if #myChart exists
	if ($("#myChart").length) {
		$("#myChart").remove();
	}

	// Check if #loading-message exists
	if ($("#loading-message").length) {
		$("#loading-message").remove();
	}

	// Check if #chart exists
	$("hr").show();
	$("#chart").empty();
	$("#chart").show();

	// Add loading spinner to bar chart div
	$("#bar-chart-section").prepend('<div id="loading-message"' +
		'style="text-align:center; padding: 15vh 30vw; font-size:1.5em; color:#5b5b5b; font-style:italic;">' +
		'<span >🧠 Clasificando mensajes...</span>' +
		'</div>');

	// Arreglos que guardan las fechas (por ejemplo: '04 Nov') y los mensajes por estas fechas
	var dates_day_month = [];
    var messages_by_day_month = [];

	// Contadores de mensajes por categoría
	var category_counts_by_day = [];
	category_counts_by_day["Logistica"] = [];
	category_counts_by_day["Codigo"] = [];
	category_counts_by_day["Intrascendente"] = [];

	// Itera sobre los mensajes
	for (var i = 0; i < messages_data.length; i++) {
		// Obtiene la fecha del mensaje en formato DD MM
        var msg_day_month = formatWhatsappDayMonth(messages_data[i].date);

		// Si no existe el arreglo de mensajes para esta fecha, lo crea
		if (!messages_by_day_month[msg_day_month]) {
			messages_by_day_month[msg_day_month] = [];
		}

		// Agrega el mensaje al arreglo de mensajes de la fecha actual
		messages_by_day_month[msg_day_month].push(messages_data[i].message);

		// Si no existe la fecha en el arreglo de fechas, la agrega
		if (!dates_day_month.includes(msg_day_month)) {//Si la fecha actual no existe en la lista lo guarda
			dates_day_month.push(msg_day_month);//guarda la fecha en formato DD MM
		}
	}

	// Genera una llamada asíncrona para clasificar los mensajes
    (async () => {
        for (const day in messages_by_day_month) {
            // Inicializamos los contadores de mensajes por categoría para este día
			category_counts_by_day["Logistica"][day] = 0;
			category_counts_by_day["Codigo"][day] = 0;
			category_counts_by_day["Intrascendente"][day] = 0;

            // Iteramos sobre los mensajes de este día
            for (var i = 0; i < messages_by_day_month[day].length; i++) {
                var msg = {
                    message: messages_by_day_month[day][i]
                };

                // Hacemos una llamada asíncrona a la API para clasificar el mensaje
				var direccion_completa = '/' + prefix + '/classify';
                await fetch(direccion_completa, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(msg)
                })
                    .then(response => response.json())
                    .then(data => {
						// Imprime el mensaje y su clasificación en consola
						console.log(' ');
						console.log('📅', day);
						let cat_icon = data.category == 'Logistica' ? '🗣️' : data.category == 'Codigo' ? '🧑‍💻' : data.category == 'Intrascendente' ? '🎲' : '🤷';
						console.log(cat_icon, data.category);
						console.log(data.scores);
						console.log('💬', msg.message);
						console.log(' ');

						category_counts_by_day[data.category][day]++;
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    }
                    );
            }
        }
    })()
        .then(() => {
			// Si existe el mensaje de carga, lo elimina
			if ($("#loading-message").length) {
				$("#loading-message").remove();
			}
			// Genera el gráfico de barras con los datos obtenidos
            generateChart(dates_day_month, category_counts_by_day);
        });

	// Obtiene los contactos únicos
	uniqueContacts = messages_data.map(function(item) {
            return item.author;
        }).filter(onlyUnique);
	
	// Crea la matriz de relaciones
	relationships = createRelationshipMatrix(uniqueContacts);


	if (uniqueContacts.length >= 99) {
		$("tbody").empty();
		for (var i = 0; i < uniqueContacts.length; i++)
			$("tbody").append('<tr> <th scope="row" class="col-3">' + (i + 1) + '</th>' +
				'<td colspan="4" class="col-9" style="color:' + colors[i % colors.length] + ';">' + uniqueContacts[i] + '</td>' +
				'</tr>');
	} 

	// Deshabilita el popover
	disablePopover();
	if (uniqueContacts.length < 99) {
		$("#chat").empty(); // Clean old chat
		$("#chat").show();
		$("tbody").hide();
		$("#tabla").hide();
	}
	else {
		$("#chat").hide();
		$("tbody").show();
		$("#tabla").show();
	}

	// Itera sobre todos los mensajes
	for (var i = 0; i < messages_data.length; i++) {
		// Obtiene el índice del contacto actual
		var index = uniqueContacts.indexOf(messages_data[i].author);

		if (i > 0) {
			var index2 = uniqueContacts.indexOf(messages_data[i-1].author);
			if (index != index2)
				relationships[index2][index]++;
        }
	
		if (uniqueContacts.length < 99) {
            let author_same_as_previous = i > 0 && messages_data[i - 1].author == messages_data[i].author;
			var message = makeMessage(messages_data[i], index, author_same_as_previous);

			$("#chat").append(message);
		}
		
	}

	// Crea el diagrama Chord de forma asíncrona
	(async () => {
		await makeChordDiagram(relationships, uniqueContacts, colors, true);
	})();

});


// ************************************************************
// ************************************************************
//                  Funciones con animaciones
// ************************************************************
// ************************************************************






// ************************************************************
// ************************************************************
//                  Funciones auxiliares
// ************************************************************
// ************************************************************

// Esta función limita la frecuencia con la que se ejecuta una función
/**
 * Esta función limita la frecuencia con la que se ejecuta una función.
/**
 * Esta función limita la frecuencia con la que se ejecuta una función.
 * @param {*} func La función que se desea ejecutar.
 * @param {*} wait El tiempo de espera en milisegundos.
 * @returns La función con la limitación de frecuencia.
 */
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

/**
 * Esta función verifica si una fecha es la fecha de hoy.
 * @param {*} date  La fecha que se desea verificar.
 * @returns  True si la fecha es la fecha de hoy, False en caso contrario.
 */
function isToday(date) {
	return date.getDate() === today_day &&
		date.getMonth() === today_month &&
		date.getFullYear() === today_year;
}

/**
 * Esta función da formato a una fecha para mostrarla en el chat de whatsapp.
 * @param {*} date  La fecha que se desea formatear.
 * @returns  La fecha formateada.
 * @example
 * // returns '12:34'
 * getTimeFormatted(new Date('2021-01-01T12:34:56'))
 */
function getTimeFormatted(date) {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Esta función da formato a una fecha para mostrarla en el chat de whatsapp.
 * Si la fecha es de hoy, solo muestra la hora.
 * Si la fecha no es de hoy, muestra el día de la semana, el día del mes, el mes y la hora.
 * Si la fecha no es de este año, muestra el año.
 * @param {*} date_string  La fecha que se desea formatear.
 * @returns  La fecha formateada.
 * @example
 * // returns '12:34' (if today is 2023-04-11)
 * formatWhatsappDate('2023-04-11T12:34:56')
 * // returns 'Sat 04 Nov 12:34' (if today is not 2023-04-11)
 * formatWhatsappDate('2023-04-11T12:34:56')
 * // returns 'Sat 04 Nov 23 12:34' (if current year is not 2023)
 * formatWhatsappDate('2023-04-11T12:34:56')
 */
function formatWhatsappDate(date_string) {
	date = new Date(date_string);
	let formatted_date = '';

	if (!isToday(date)) {
		formatted_date += date.toLocaleString(undefined, { weekday: 'short' }) + ' ';
		formatted_date = formatted_date.charAt(0).toUpperCase() + formatted_date.slice(1);
		formatted_date += String(date.getDate()).padStart(2, '0') + ' ';
		formatted_date += date.toLocaleString(undefined, { month: 'short' }) + ' ';

		if (date.getFullYear() !== today_year) {
			formatted_date += ' ' + String(date.getFullYear()).slice(-2) + ' ';
		}

		formatted_date += getTimeFormatted(date);
	}
	else {
		formatted_date = getTimeFormatted(date);
	}
	return formatted_date;
}

// Needs update
function formatWhatsappHour(date) {
	var auxdate;
	auxdate = formatWhatsappDate(date);
	return auxdate.slice(auxdate.length - 5, auxdate.length);
}

// Needs update
function formatWhatsappDayMonth(date) {
	var auxdate;
	auxdate = formatWhatsappDate(date);
	return auxdate.slice(4, 10);
}

// Returns unique values from an array
/**
 * Esta función se usa para obtener los valores únicos de un arreglo.
 * @param {*} value El elemento que se está evaluando.
 * @param {*} index El índice del elemento que se está evaluando.
 * @param {*} self El arreglo que se está evaluando.
 * @returns  True si el primer índice en el cual se encuentra value es igual al índice actual, False en caso contrario.
 * @example
 * // returns [1, 2, 3]
 * [1, 2, 2, 3, 3, 3].filter(onlyUnique)
 * @example
 * // returns ['a', 'b', 'c']
 * ['a', 'b', 'b', 'c', 'c', 'c'].filter(onlyUnique)
 */
function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

/**
 * Esta función crea una matriz de relaciones.
 * @param {*} uniqueContacts  Los contactos únicos.
 * @returns  La matriz de relaciones.
 * @example
 * // returns [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
 * createRelationshipMatrix(['contact1', 'contact2', 'contact3'])
 */
function createRelationshipMatrix(uniqueContacts) {
	var relationships = [];
	for (var i = 0; i < uniqueContacts.length; i++) {
		var tmp = []; // Creates new array
		for (var j = 0; j < uniqueContacts.length; j++)
			tmp.push(0);
		relationships.push(tmp);
	}
	return relationships;
}

/**
 * Esta función escapa los caracteres especiales de un string para que pueda ser mostrado en el chat de whatsapp.
 * @param {*} unsafe  El string que se desea escapar.
 * @returns  El string escapado.
 * @example
 * // returns '&lt;script&gt;alert("Hello");&lt;/script&gt;'
 * escapeHtml('<script>alert("Hello");</script>')
 */
function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// Gives format to the html whatsapp style messages
/**
 * Esta función da formato a los mensajes para mostrarlos en el chat de whatsapp.
 * @param {*} message_data  El mensaje que se desea formatear.
 * @param {*} author_index  El índice del autor del mensaje.
 * @param {*} author_same_as_previous  True si el autor del mensaje es el mismo que el del mensaje anterior, False en caso contrario.
 * @returns  El mensaje formateado.
 */
function makeMessage(message_data, author_index, author_same_as_previous) {
	var message = `<div class="msg">
						<div class="bubble {0}">
							<div class="txt">
								{1}
								<p class="message {2}">${escapeHtml(message_data.message)}</p>
								<span class="timestamp">${formatWhatsappDate(message_data.date)}</span>
							</div>
							{3}
						</div>
					</div>`;
	if (message_data.author == null) // If message is a system message
		if (author_same_as_previous)
			return message.format("altfollow", "", "follow", "");
		else return message.format("alt", `<span class="name alt">System</span>`,
			"", '<div class="bubble-arrow alt"></div>');
	else if (author_same_as_previous)
		return message.format("follow", "", "follow", "");
	else {
		var coloredContact = `<span class="name"
					style="color: ${colors[author_index % colors.length]}">${message_data.author}</span>`;
		return message.format("", coloredContact, "", '<div class="bubble-arrow"></div>');
	}
}

/**
 * Este código es una función auxiliar para dar formato a un string.
 * @param {*} args  Los argumentos que se desean formatear.
 * @returns  El string formateado.
 * 
 */
String.prototype.format = function () {
	a = this;
	for (k in arguments) {
		a = a.replace("{" + k + "}", arguments[k])
	}
	return a
}

/**
 * Genera el gráfico de barras con los datos obtenidos.
 * @param {*} days  Los días que se desean mostrar en el gráfico.
 * @param {*} category_counts_by_day  Los mensajes por categoría por día.
 */
function generateChart(days, category_counts_by_day) {
	// Obtiene el contexto del elemento canvas con el id 'myChart'
	$("#myChart").remove();
	$('.chart-container').append("<canvas id='myChart'></canvas>");

	var ctx = document.getElementById('myChart').getContext('2d');

	const codigo = days.map(day => category_counts_by_day["Codigo"][day]);
	const organizacion = days.map(day => category_counts_by_day["Logistica"][day]);
	const intrascendente = days.map(day => category_counts_by_day["Intrascendente"][day]);

	// Colores aleatorios
	// color_index = Math.floor(Math.random() * colors.length);
	// var color1 = colors[color_index % colors.length];
	// var color2 = colors[(color_index + 1) % colors.length];
	// var color3 = colors[(color_index + 2) % colors.length];
	// var color1 = "#C6DE89";
	// var color2 = "#eed27a";
	// var color3 = "#d4d4d4";

	//Crea una nueva instancia de Chart.js, configurando un gráfico de barras apiladas
	var chart = new Chart(ctx, {
		//Tipo de gráfico de barras
		type: 'bar',
		//Datos para el conjunto de datos del gráfico
		data: {
			labels: days,		//Etiquetas en el eje X (días)
			datasets: [
				{
					label: 'Código',							//Etiqueta para el conjunto de datos
					backgroundColor: 'rgba(161,221,113, 255)', //Color de las barras
					data: codigo, 								//Datos para este conjunto
					stack: 'Stack 0',							//Define la pila a la que pertenecerán las barras
				},
				{
					label: 'Organización',						//Etiqueta para el conjunto de datos
					backgroundColor: 'rgba(106,159,194, 255)',	//Color de las barras
					data: organizacion, 					//Datos para este conjunto
					stack: 'Stack 0',							//Define la pila a la que pertenecerán las barras
				},
				{
					label: 'Intrascendente',					//Etiqueta para el conjunto de datos
					backgroundColor: 'rgba(189,103,189,255)',	//Color de las barras
					data: intrascendente, 					//Datos para este conjunto
					stack: 'Stack 0',							//Define la pila a la que pertenecerán las barras
				}
			]
		},

		//Opciones de configuración para el gráfico
		options: {
			plugins: {
				title: {
					display: true,
					text: 'Distribución de mensajes en el tiempo, por categoría'		//Título del gráfico
				},
			},
			responsive: true,								//Hace el gráfico responsive
			interaction: {
				intersect: false,
			},
			scales: {
				x: {
					stacked: true,							//Apila las barras en el eje X
				},
				y: {
					stacked: true								//Apila las barras en el eje Y
				}
			}
		}
	});
}



// ************************************************************
// ************************************************************
//                  Chord Diagram
// ************************************************************
// ************************************************************

// Función para actualizar el tamaño del gráfico al cambiar el tamaño de la ventana
/** 
 * Esta función se ejecuta cuando se cambia el tamaño de la ventana.
 * Se encarga de actualizar el tamaño del diagrama Chord.
 *
 * @async
 * @returns  La promesa de actualizar el tamaño del diagrama.
 */
async function resizeChordDiagram() {
    // Actualiza el tamaño del diagrama
	// Check if svg exists
	var svg = d3.select("#chart").select("svg").node();

	if (svg) {
		d3.select("#chart").select("svg").remove();
		await makeChordDiagram(relationships, uniqueContacts, colors, true);
	}
}

// Event listener para actualizar el tamaño del gráfico al cambiar el tamaño de la ventana
//window.addEventListener('resize', debounce(resizeChordDiagram, 500));


// ************************************************************
// ************************************************************
//                Mostrar y ocultar elementos
// ************************************************************
// ************************************************************

// When document is ready
/**
 * Esta función se ejecuta cuando el documento está listo.
 * Se encarga de ocultar los elementos que no se deben mostrar al inicio.
 */
$(document).ready(function () {
	$("#chord-chat-section").hide();
	$("#bar-chart-section").hide();
});

// Cuando se lee un archivo
/**
 * Esta función se ejecuta cuando se lee un archivo.
 * Se encarga de mostrar los elementos que se deben mostrar al leer un archivo.
 */
function showAppElements() {
	$("#chord-chat-section").show();
	$("#bar-chart-section").show();
	$("#instructions-section").hide();
}