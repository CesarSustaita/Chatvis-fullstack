var colors = [
	"#ff7400", "#7ceac9", "#57abe4", "#262043", "#a74949",
	"#7da557", "#a74949", "#eed27a", "#60b28f", "#e7a7b1",
	"#301E1E", "#083E77", "#342350", "#567235", "#8B161C",
	"#DF7C00", "#00BCD4", "#F26623", "#C6DE89", "#FFB52A"
];

var whatsMessages;

var reader = new FileReader();
var readerSA = new FileReader();

var input = document.getElementById("whatsChat");
var inputSA = document.getElementById("whatsChatSinAnimaciones");


// sleep time expects milliseconds
function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

// Returns unique values from an array
function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

function sanitizeWhatsMessage(message) {
	var array = message.split('","');

	// Remove remaining " from contact
	array[0] = array[0].replace("\"", "");
	// Decode back string
	array[2] = decodeURIComponent(escape(array[2])).trim();
	// Strim unnecessary info
	array[2] = array[2].substring(0, array[2].length - 1);
	// Replace special characters
	array[2] = array[2].replace(/\\n/g, "\n");
	array[2] = array[2].replace(/\\\"/g, "\"");

	return array;
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

// Gives format to the html whatsapp style messages
function makeMessage(i, index, contacts, messages, date) {
	var message = `<div class="msg">
						<div class="bubble {0}">
							<div class="txt">
								{1}
								<p class="message {2}">${messages[i]}</p>
								<span class="timestamp">${date}</span>
							</div>
							{3}
						</div>
					</div>`;
	if (contacts[i] == "System")
		if (i > 0 && contacts[i - 1] == contacts[i])
			return message.format("altfollow", "", "follow", "");
		else return message.format("alt", `<span class="name alt">${contacts[i]}</span>`,
			"", '<div class="bubble-arrow alt"></div>');
	else if (i > 0 && contacts[i - 1] == contacts[i])
		return message.format("follow", "", "follow", "");
	else {
		var coloredContact = `<span class="name"
					style="color: ${colors[index % colors.length]}">${contacts[i]}</span>`;
		return message.format("", coloredContact, "", '<div class="bubble-arrow"></div>');
	}
}

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
		date = date.toUTCString();
		date = date.substring(0, date.length - 7);
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
	return auxdate.slice(4, 11);
}
// Allows format as Python
String.prototype.format = function () {
	a = this;
	for (k in arguments) {
		a = a.replace("{" + k + "}", arguments[k])
	}
	return a
}
// Loads Whatsapp Chat
reader.addEventListener('load', function (e) {
	whatsappChatParser
		.parseString(e.target.result)
		.then(json => {
			var fields = Object.keys(json[0]);
			var replacer = function (key, value) {
				return value === null ? '' : value
			};
			whatsMessages = json.map(function (row) {
				return fields.map(function (fieldName) {
					return JSON.stringify(row[fieldName], replacer)
				}).join(',');
			});
		})
		.catch(err => {
			console.log(err);
		});
});

input.addEventListener("change", function () {
	if (this.files && this.files[0]) {
		var whatsChat = this.files[0];

		// Loads the file, triggering the event
		reader.readAsBinaryString(whatsChat);
	};
});

reader.addEventListener('loadend', function (e) {
	$("#chart").show();
	$("hr").show();
	$("#tiempo").show();
	$("#chart").empty(); // Clean old SVG

	var dates = [],
		contacts = [],
		dayMonth = [],
		countmessages = [],
		messages = [];
	var ind=-1;
	for (var i = 0; i < whatsMessages.length; i++) {
		var array = sanitizeWhatsMessage(whatsMessages[i]);

		dates.push(array[0]);
		contacts.push(array[1]);
		messages.push(array[2]);
		if (!dayMonth.includes(formatWhatsappDayMonth(array[0]))) {//Si la fecha actual no existe en la lista lo guarda
			dayMonth.push(formatWhatsappDayMonth(array[0]));//guarda la fecha en formato DD MM
			ind++;
			countmessages.push(1);
		}
		else{
			countmessages[ind]+=1;
		}
	}
	for (var i = 0; i < countmessages.length; i++)
	{
		console.log(countmessages[i]);
	}
	var uniqueContacts = contacts.filter(onlyUnique);
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
	(function update(i) {
		setTimeout(function () {
			if (uniqueContacts.length < 99)
				$("#chat").height($("#chart").height());

			var index = uniqueContacts.indexOf(contacts[i]);

			if (i > 0) {
				var index2 = uniqueContacts.indexOf(contacts[i - 1]);
				if (index != index2)
					relationships[index2][index]++;
			}
			$("#chart").empty(); // Clean old SVG

			// Enable popovers
			if (i + 1 == contacts.length) {
				makeChordDiagram(relationships, uniqueContacts, colors, true);
				$("#tiempo").hide();
			}
			else makeChordDiagram(relationships, uniqueContacts, colors);

			var date = formatWhatsappDate(dates[i]);
			$("#tiempo").empty();
			$("#tiempo").append(date);

			if (uniqueContacts.length < 99) {
				var message = makeMessage(i, index, contacts, messages, date);

				$("#chat").append(message);
				$("#chat").stop().animate({
					scrollTop: $('#chat')[0].scrollHeight
				}, ((i - 1) < 100 ? 75 : Math.max(5, 75 - ((i - 1) - 100))));
			}

			if (++i < contacts.length) update(i);
		}, (i < 100 ? 75 : Math.max(5, 75 - (i - 100))));
	})(0);

	generateChart(dayMonth,countmessages);
});

// Loads Whatsapp Chat
readerSA.addEventListener('load', function (e) {
	whatsappChatParser
		.parseString(e.target.result)
		.then(json => {
			var fields = Object.keys(json[0]);
			var replacer = function (key, value) {
				return value === null ? '' : value
			};
			whatsMessages = json.map(function (row) {
				return fields.map(function (fieldName) {
					return JSON.stringify(row[fieldName], replacer)
				}).join(',');
			});
		})
		.catch(err => {
			console.log(err);
		});
});

inputSA.addEventListener("change", function () {
	if (this.files && this.files[0]) {
		var whatsChat = this.files[0];

		// Loads the file, triggering the event
		readerSA.readAsBinaryString(whatsChat);

	};
});
var prueba = []; var hr_ini, min_ini; var label_time = [];
readerSA.addEventListener('loadend', function (e) {
	$("hr").show();
	$("#chart").empty(); // Clean old SVG
	$("#chart").show();
	var hr_act, min_act;
	var dates = [],
		contacts = [],
		dayMonth = [],
		countmessages = [],
		messages = [];

	var ind=-1,aux=0;
	for (var i = 0; i < whatsMessages.length; i++) {
		var array = sanitizeWhatsMessage(whatsMessages[i]);
		dates.push(array[0]);
		contacts.push(array[1]);
		messages.push(array[2]);
		prueba.push(i);
		//console.log(formatWhatsappDayMonth(array[0]));
		if (!dayMonth.includes(formatWhatsappDayMonth(array[0]))) {//Si la fecha actual no existe en la lista lo guarda
			dayMonth.push(formatWhatsappDayMonth(array[0]));//guarda la fecha en formato DD MM
			ind++;
			countmessages.push(1);
		}
		else{
			countmessages[ind]+=1;
		}
		
		//var horas = hora[0] + hora[1];
		
	}
	for (var i = 0; i < countmessages.length; i++)
	{
		console.log(countmessages[i]);
	}
	//console.log(countmessages.length);
	//console.log(label_time.length);

	var uniqueContacts = contacts.filter(onlyUnique);
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

	for (var i = 0; i < contacts.length; i++) {
		var index = uniqueContacts.indexOf(contacts[i]);

		if (i > 0) {
			var index2 = uniqueContacts.indexOf(contacts[i - 1]);
			if (index != index2)
				relationships[index2][index]++;
		}

		if (uniqueContacts.length < 99) {
			var date = formatWhatsappDate(dates[i]);
			var message = makeMessage(i, index, contacts, messages, date);

			$("#chat").append(message);
		}
	}

	makeChordDiagram(relationships, uniqueContacts, colors, true);

	if (uniqueContacts.length < 99)
		$("#chat").height($("#chart").height());

	generateChart(dayMonth,countmessages);
});

$(document).ready(function () {
	$("tbody").hide();
	$("#tabla").hide();
	$("#tiempo").hide();
});

function generateChart(days,countMess) {

	var ctx = document.getElementById('myChart').getContext('2d');
	var chart = new Chart(ctx, {
		// The type of chart we want to create
		type: 'bar',
		// The data for our dataset
		data: {
			labels: days,
			datasets: [{
				label: 'Cantidad de mensajes enviados por día',
				fontColor: 'black',
				/*backgroundColor: 'rgb(20, 183, 110)',*/
				backgroundColor: 'rgb(83, 207, 217)',
				borderColor: 'rgb(20, 183, 110)',
				data: countMess
			}]
		},

		// Configuration options go here
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	});
	
	chart.canvas.parentNode.style.height = '600px';
	chart.canvas.parentNode.style.width = '60%';
}
/*
var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
	type: 'bar',
	data: {
		labels: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00','15:30', '16:00', '16:30', '17:00', '17:30', '18:30', '19:00'],
		datasets: [{
			label: 'Cantidad de mensajes enviados',
			data: [12, 19, 3, 5, 2, 3, 0, 10, 5, 2, 20, 30, 45, 12],
			backgroundColor: [
				'rgba(255, 99, 132, 0.2)',
				'rgba(54, 162, 235, 0.2)',
				'rgba(255, 206, 86, 0.2)',
				'rgba(75, 192, 192, 0.2)',
				'rgba(153, 102, 255, 0.2)',
				'rgba(255, 159, 64, 0.2)'
			],
			borderColor: [
				'rgba(255, 99, 132, 1)',
				'rgba(54, 162, 235, 1)',
				'rgba(255, 206, 86, 1)',
				'rgba(75, 192, 192, 1)',
				'rgba(153, 102, 255, 1)',
				'rgba(255, 159, 64, 1)'
			],
			borderWidth: 1
		}]
	},
	options: {
		scales: {
			yAxes: [{
				ticks: {
					beginAtZero: true
				}
			}]
		}
	}
});
*/