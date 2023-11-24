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

inputSA.addEventListener("change", function () {
	if (this.files && this.files[0]) {
		var whatsChat = this.files[0];

		// Check if file is .txt
		if (whatsChat.type != "text/plain") {
			swal("Error", "El archivo debe ser de tipo .txt", "error");
			this.value = '';
			return;
		}

		// Loads the file, triggering the event
		readerSA.readAsText(whatsChat, 'UTF-8');
	};
});

// Cuando se carga el archivo se ejecuta esta funcion
readerSA.addEventListener('load', function (e) {
	try {
		messages_data = whatsappChatParser.parseString(e.target.result);
	} catch (err) {
		console.log(err);
	}
});

// Cuando se termina de cargar el archivo se ejecuta esta funcion
readerSA.addEventListener('loadend', function (e) {
	console.clear();
	showAppElements();
	// Check if #myChart exists
	if ($("#myChart").length) {
		$("#myChart").remove();
	}

	if ($("#loading-message").length) {
		$("#loading-message").remove();
	}

	$("hr").show();
	$("#chart").empty();
	$("#chart").show();

	// Add loading spinner to bar chart div
	$("#bar-chart-section").prepend('<div id="loading-message"' +
		'style="text-align:center; padding: 15vh 30vw; font-size:1.5em; color:#5b5b5b; font-style:italic;">' +
		'<span >🧠 Clasificando mensajes...</span>' +
		'</div>');

	var dates_day_month = [];
    var messages_by_day_month = [];

	// Contadores de mensajes por categoría
	var category_counts_by_day = [];
	category_counts_by_day["Logistica"] = [];
	category_counts_by_day["Codigo"] = [];
	category_counts_by_day["Intrascendente"] = [];

	for (var i = 0; i < messages_data.length; i++) {
        var msg_day_month = formatWhatsappDayMonth(messages_data[i].date);

		if (!messages_by_day_month[msg_day_month]) {
			messages_by_day_month[msg_day_month] = [];
		}

		messages_by_day_month[msg_day_month].push(messages_data[i].message);

		if (!dates_day_month.includes(msg_day_month)) {//Si la fecha actual no existe en la lista lo guarda
			dates_day_month.push(msg_day_month);//guarda la fecha en formato DD MM
		}
	}

    (async () => {
        for (const day in messages_by_day_month) {
            // Inicializamos el contador de mensajes intrascendentes para este día
			category_counts_by_day["Logistica"][day] = 0;
			category_counts_by_day["Codigo"][day] = 0;
			category_counts_by_day["Intrascendente"][day] = 0;

            // Iteramos sobre los mensajes de este día
            for (var i = 0; i < messages_by_day_month[day].length; i++) {
                var msg = {
                    message: messages_by_day_month[day][i]
                };

                // Realiza la clasificación del mensaje
                await fetch('/classify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(msg)
                })
                    .then(response => response.json())
                    .then(data => {
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
			if ($("#loading-message").length) {
				$("#loading-message").remove();
			}
            generateChart(dates_day_month, category_counts_by_day);
        });

	uniqueContacts = messages_data.map(function(item) {
            return item.author;
        }).filter(onlyUnique);
	relationships = createRelationshipMatrix(uniqueContacts);

	if (uniqueContacts.length >= 99) {
		// $("#chart").css('width', '100%');
		$("tbody").empty();
		for (var i = 0; i < uniqueContacts.length; i++)
			$("tbody").append('<tr> <th scope="row" class="col-3">' + (i + 1) + '</th>' +
				'<td colspan="4" class="col-9" style="color:' + colors[i % colors.length] + ';">' + uniqueContacts[i] + '</td>' +
				'</tr>');
	} 
	// else $("#chart").css('width', '45%');

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

	for (var i = 0; i < messages_data.length; i++) {
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

	makeChordDiagram(relationships, uniqueContacts, colors, true);

	// if (uniqueContacts.length < 99)
	// 	$("#chat").height($("#chart").height());
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

function isToday(date) {
	return date.getDate() === today_day &&
		date.getMonth() === today_month &&
		date.getFullYear() === today_year;
}

function getTimeFormatted(date) {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

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

function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// Gives format to the html whatsapp style messages
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

String.prototype.format = function () {
	a = this;
	for (k in arguments) {
		a = a.replace("{" + k + "}", arguments[k])
	}
	return a
}

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
					label: 'Codigo',							//Etiqueta para el conjunto de datos
					backgroundColor: 'rgba(161,221,113, 255)', //Color de las barras
					data: codigo, 								//Datos para este conjunto
					stack: 'Stack 0',							//Define la pila a la que pertenecerán las barras
				},
				{
					label: 'Organizacion',						//Etiqueta para el conjunto de datos
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
function resizeChordDiagram() {
    // Actualiza el tamaño del diagrama
	d3.select("#chart").select("svg").remove();
	makeChordDiagram(relationships, uniqueContacts, colors, true);
}

// Event listener para actualizar el tamaño del gráfico al cambiar el tamaño de la ventana
window.addEventListener('resize', resizeChordDiagram);


// ************************************************************
// ************************************************************
//                Mostrar y ocultar elementos
// ************************************************************
// ************************************************************

// When document is ready
$(document).ready(function () {
	$("#chord-chat-section").hide();
	$("#bar-chart-section").hide();
});

// Cuando se lee un archivo
function showAppElements() {
	$("#chord-chat-section").show();
	$("#bar-chart-section").show();
	$("#instructions-section").hide();
}