// Variables globales

// Mensaje de error al cargar el archivo
// Imprimir mensajes en consola

var input = document.getElementById("whatsChat");
var inputSA = document.getElementById("whatsChatSinAnimaciones");

var reader = new FileReader();
var readerSA = new FileReader();

var messages_data = [];

// Contadores de mensajes por categoría
var countIntrascendente = 0;
var countLogistica = 0;
var countCodigo = 0;
var intrascendenteByDay = [];
var logisticaByDay = [];
var codigoByDay = [];
const cdByDay = new Map(); //intrascendenteByDay
const inByDay = new Map(); //logisticaByDay
const orByDay = new Map(); //codigoByDay

// Colores
var colors = [
	"#ff7400", "#7ceac9", "#57abe4", "#262043", "#a74949",
	"#7da557", "#a74949", "#eed27a", "#60b28f", "#e7a7b1",
	"#301E1E", "#083E77", "#342350", "#567235", "#8B161C",
	"#DF7C00", "#00BCD4", "#F26623", "#C6DE89", "#FFB52A"
];


// ************************************************************
// ************************************************************
//                  Funciones sin animaciones
// ************************************************************
// ************************************************************

inputSA.addEventListener("change", function () {
	if (this.files && this.files[0]) {
		var whatsChat = this.files[0];

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
	$("hr").show();
	$("#chart").empty();
	$("#chart").show();

	// var dates = [];
	// var contacts = [];
	var dates_day_month = [];
	// var count_messages = [];
	// var messages = [];
    var messages_by_day_month = [];
	
	var ind = -1;

	for (var i = 0; i < messages_data.length; i++) {
		// dates.push(messages_json[i].date);
		// contacts.push(messages_json[i].author);
		// messages.push(messages_json[i].message);

        var msg_day_month = formatWhatsappDayMonth(messages_data[i].date);

		if (!messages_by_day_month[msg_day_month]) {
			messages_by_day_month[msg_day_month] = [];
		}

		messages_by_day_month[msg_day_month].push(messages_data[i].message);

		if (!dates_day_month.includes(msg_day_month)) {//Si la fecha actual no existe en la lista lo guarda
			dates_day_month.push(msg_day_month);//guarda la fecha en formato DD MM
			ind++; // ??????
			// count_messages.push(1);
		}
		// else{
		// 	// count_messages[ind]+=1;
		// }
		
		var msg_json = {
			message: messages_data[i].message  // Mensaje correspondiente a la fecha
		};

		// fetch('/classify',  {
		// 	method: 'POST',
		// 	headers: {
		// 		'Content-Type': 'application/json',
		// 	},
		// 	body: JSON.stringify(msg_json)
		// })
		// .then(response => response.json())
		// .then(response_data => {
		// 	// intrascendenteByDay
		// 	console.log('Success');
		// 	console.log('msg: ', msg_json);
		// 	console.log('category: ', response_data);
			
		// 	if(response_data.category === "Intrascendente"){
		// 		countIntrascendente++;
		// 	}
		// 	if(response_data.category === "Logistica"){
		// 		countLogistica++;
		// 	}
		// 	if(response_data.category === "Codigo"){
		// 		countCodigo++;
		// 	}
		// })
		// .catch((error) => {
        //     console.error('Error: ', error);
		// });
	}

    console.log('messages_by_day_month: ', messages_by_day_month);
    console.log('dates_day_month: ', dates_day_month);
    // console.log('count_messages: ', count_messages);
    // console.log('messages: ', messages);
    // console.log('dates: ', dates);
    // console.log('contacts: ', contacts);
    // console.log('countIntrascendente: ', countIntrascendente);
    // console.log('countLogistica: ', countLogistica);
    // console.log('countCodigo: ', countCodigo);


    (async () => {
        for (const day in messages_by_day_month) {
            // Inicializamos el contador de mensajes intrascendentes para este día
            intrascendenteByDay[day] = 0;
            logisticaByDay[day] = 0;
            codigoByDay[day] = 0;

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
                        // Incrementa el contador según la categoría
                        if (data.category === "Intrascendente") {
                            intrascendenteByDay[day]++;
                        }
                        else if (data.category === "Logistica") {
                            logisticaByDay[day]++;
                        }
                        else if (data.category === "Codigo") {
                            codigoByDay[day]++;
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    }
                    );
            }
            
            cdByDay.set(day, codigoByDay[day]);
            inByDay.set(day, intrascendenteByDay[day]);
            orByDay.set(day, logisticaByDay[day]);
        }
    })()
        .then(() => {
            generateChart(dates_day_month, count_messages, orByDay, cdByDay, inByDay);
        });

    // for (var i = 0; i < count_messages.length; i++) {
    //     // console.log(count_messages[i]);
    //     console.log("Dia " + i + ": " + count_messages[i]);  // Cantidad de mensajes por día
    // }
	//console.log(countmessages.length);
	//console.log(label_time.length);

    // var contacts = messages_data.map(function(item) {
    //     return item.author;
    // });

	var uniqueContacts = messages_data.map(function(item) {
            return item.author;
        }).filter(onlyUnique);
	var relationships = createRelationshipMatrix(uniqueContacts);

	if (uniqueContacts.length >= 99) {
		$("#chart").css('width', '100%');
		$("tbody").empty();
		for (var i = 0; i < uniqueContacts.length; i++)
			$("tbody").append('<tr> <th scope="row" class="col-3">' + (i + 1) + '</th>' +
				'<td colspan="4" class="col-9" style="color:' + colors[i % colors.length] + ';">' + uniqueContacts[i] + '</td>' +
				'</tr>');
	} else $("#chart").css('width', '45%');

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
            let author_same_as_previous = i > 0 && contacts[i - 1] == contacts[i];
			var message = makeMessage(messages_data[i], index, author_same_as_previous)

			$("#chat").append(message);
		}
		
	}

	makeChordDiagram(relationships, uniqueContacts, colors, true);

	if (uniqueContacts.length < 99)
		$("#chat").height($("#chart").height());
    
	// console.log('antes de generate', codigoByDay)
	// console.log('antes de generateasdasd', dates_day_month)
	// console.log('valores antes de generate: ', cdByDay);
	//generateChart(dayMonth,countmessages, logisticaByDay, codigoByDay, cdByDay);
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
	const today = new Date();
	return date.getDate() == today.getDate() &&
		date.getMonth() == today.getMonth() &&
		date.getFullYear() == today.getFullYear();
}

function formatWhatsappDate(date) {
	date = new Date(date);

	if (!isToday(date)) {
		// Remove extra info from default format
		date = date.toString();
		date = date.substring(0, 22);
	}
	else {
		date = date.toLocaleTimeString(); // Displays time
		date = date.substring(0, date.length - 3);
	}
	return date;
}

function formatWhatsappHour(date) {
	var auxdate;
	auxdate = formatWhatsappDate(date);
	return auxdate.slice(auxdate.length - 5, auxdate.length);
}

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

function makeMessage(message_data, author_index, author_same_as_previous) {
	var message = `<div class="msg">
						<div class="bubble {0}">
							<div class="txt">
								{1}
								<p class="message {2}">${message_data.message}</p>
								<span class="timestamp">${formatWhatsappDate(message_data.date)}</span>
							</div>
							{3}
						</div>
					</div>`;
	if (message_data.author == "System")
		if (author_same_as_previous)
			return message.format("altfollow", "", "follow", "");
		else return message.format("alt", `<span class="name alt">${message_data.author}</span>`,
			"", '<div class="bubble-arrow alt"></div>');
	else if (i > 0 && contacts[i - 1] == contacts[i])
		return message.format("follow", "", "follow", "");
	else {
		var coloredContact = `<span class="name"
					style="color: ${colors[author_index % colors.length]}">${message_data.author}</span>`;
		return message.format("", coloredContact, "", '<div class="bubble-arrow"></div>');
	}
}