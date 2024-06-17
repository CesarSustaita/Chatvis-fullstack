var chat_content;
var analisisCountCallPending = false;
var basePathname = window.location.pathname.split('/').slice(0, -1).join('/');

var shouldStopAnalysis = false;
var chordAnalysisFinished = false;
var semanticAnalysisFinished = false;

var chatDisplayName = "Chat";
var messageDisplayCount = 0;
var resizeTimeout;

// Variables de elementos HTML
var loadingSpinnerID = "#spinner-full-page";
var chordParentID = "#chord-chart-container";
var chordDownloadButtonIDNoHashtag = "buttonDownloadChord";
var chatContainerID = "#chat";
var histogramParentID = "#histogram-chart-container";
var histogramCanvasID = "#histogram-canvas";
var histogramCanvasIDNoHashtag = "histogram-canvas";
var histogramProgressBarID = "#histogram-progress-bar";
var chatMembersCountID = "#chat-members-count";
var chatMessagesCountID = "#chat-messages-count";
var membersButtonIDNoHashtag = "buttonMembers";
var membersTableBodyID = "#membersTableBody";
var membersTableBodyIDNoHashtag = "membersTableBody";

// var maxUniqueContacts = 99;

var membersTableIsComplete = false;
var messagesByMemberCounts = {};

// Variables globales de mensajes
var messagesParsedData = [];
var uniqueContacts;
var messageIDsByDate = {};
var classificationData = {};

// Arreglos que guardan las fechas (por ejemplo: '04 Nov') y los mensajes por estas fechas
var dates_day_month = [];
var messages_by_day_month = [];

// Variables de fechas
const today = new Date();
const today_day = today.getDate();
const today_month = today.getMonth();
const today_year = today.getFullYear();

// Variables para el diagrama Chord
var relationships = [];

// Variables del análisis semántico
const class_keys ={
    0: "LOGISTICA",
    1: "CODIGO",
    2: "INTRASCENDENTE"
}
var barChartLabels = [];
var barChartDatasets = [];
var classifications_are_cached = false; // ???
var message_classifications = {}; //???
var category_counts_by_day = { // ???
    LOGISTICA: {},
    CODIGO: {},
    INTRASCENDENTE: {}
};
var classChart;

// Variables usadas en la versión dinámica (chord y chat) para ajustar la velocidad de actualización
// según el número de mensajes y el performance del dispositivo
var msgProcTimes = [1];
var avgMsgProcTime = 0;
var msgIdealTime = 0;
var msgProcTime = 0;
var msgAimTime = 1;
var totalAnimationTime = 10000; // 10 seconds
var updateInterval = 42; // Time between UI updates in ms
var minMsgDelay = 1;
var maxMsgDelay = 150;
var batchSize = 1; // 1 msg per batch, initially
var batchMsgCount = 0; // Messages in current batch fragment
var batchProcTime = 0; 
var batchAimTime = 1;
var chordProcTime = 0;

var current_msg_author_index = 0;
var previous_msg_author_index = 0;

// Variables para virtual scrolling del chat
var virtualScrolling = false;
var lastChatScroll = 0;
var firstVisibleMessageID = 0;
var lastVisibleMessageID = 0;

// Colores
var colors = [
    "#ff7400", "#7ceac9", "#57abe4", "#262043", "#a74949",
    "#7da557", "#a74949", "#eed27a", "#60b28f", "#e7a7b1",
    "#301E1E", "#083E77", "#342350", "#567235", "#8B161C",
    "#DF7C00", "#00BCD4", "#F26623", "#C6DE89", "#FFB52A"
];


function clearChatSessionStorage() {
    sessionStorage.removeItem('chat_file_content');
    sessionStorage.removeItem('chat_file_name');
    sessionStorage.removeItem('first_load_after_upload');
    sessionStorage.removeItem('category_counts_by_day');
    sessionStorage.removeItem('messages_data');
}


// ************************************************************
// ************************************************************
//                     Window onload
// ************************************************************
// ************************************************************

window.onload = async function() {
    setPriorityEventListeners();

    // Función principal
    await main();

    setSecondaryEventListeners();
};



// ************************************************************
// ************************************************************
//                     Event listeners
// ************************************************************
// ************************************************************

function setPriorityEventListeners() {
    // Event listener for delete chat button
    var deleteChatButton = document.getElementById('button-confirm-delete-chat');
    deleteChatButton.addEventListener('click', function () {
        clearChatSessionStorage();
        window.location.href = basePathname + '/chat_deleted';
    });

    // Event listener for restart analysis button
    var restartAnalysisButton = document.getElementById('button-confirm-restart-analysis');
    restartAnalysisButton.addEventListener('click', async function () {
        restartAnalysis();
    });
}

function setSecondaryEventListeners() {
    // Event listener para actualizar el tamaño del gráfico al cambiar el tamaño de la ventana
    window.addEventListener('resize', resizeContents);

    // Event listeners for hover on chord chart
    var chordChartContainer = document.getElementById('chord-chart-container');
    chordChartContainer.addEventListener('mouseenter', function () {
        var chordCardHeader = document.getElementById('chord-card-header');
        chordCardHeader.classList.add('card-title-fade-color');
    });
    chordChartContainer.addEventListener('mouseleave', function () {
        var chordCardHeader = document.getElementById('chord-card-header');
        chordCardHeader.classList.remove('card-title-fade-color');
    });

    // Event listeners for members button
    // var membersButton = document.getElementById(membersButtonIDNoHashtag);
    // membersButton.addEventListener('shown.bs.modal', function () {
    //     let membersModal = document.getElementById('modalMembersList');
    //     membersModal.focus();
    // });

    // Event listener for collapse chord chart button
    var collapseChordChartButton = document.getElementById('buttonCloseChord');
    collapseChordChartButton.addEventListener('click', function () {
        let chordChartContainer = document.getElementById('chord-chart-container');
        // Toggle chord card height class
        var chordCard = document.getElementById('chord-card');
        if (chordCard.classList.contains('h-60vhi')) {
            chordCard.classList.remove('h-60vhi');
            chordChartContainer.classList.remove('hideable-show');
            chordChartContainer.classList.add('hideable-hide');
        } else {
            setTimeout(() => {
                chordCard.classList.add('h-60vhi');
            }, 300);
            setTimeout(() => {
                chordChartContainer.classList.remove('hideable-hide');
                chordChartContainer.classList.add('hideable-show');
                resizeChordDiagram();
            }, 350);
        }
        // Toggle card header border class
        var cardHeader = chordCard.querySelector('.card-header');
        if (cardHeader.classList.contains('border-0')) {
            cardHeader.classList.remove('border-0');
        } else {
            setTimeout(() => {
                cardHeader.classList.add('border-0');
            }, 200);
        }
        // Rotate this button 45 degrees
        this.classList.toggle('rotate-45');
    });

    // Event listener for collapse chat button
    var collapseChatButton = document.getElementById('buttonCloseChat');
    collapseChatButton.addEventListener('click', function () {
        let chatContainer = document.getElementById('chat');
        // Toggle chat card height class
        var chatCard = document.getElementById('chat-card');
        if (chatCard.classList.contains('h-60vhi')) {
            chatCard.classList.remove('h-60vhi');
            chatContainer.classList.remove('hideable-show');
            chatContainer.classList.add('hideable-hide');
        } else {
            setTimeout(() => {
                chatCard.classList.add('h-60vhi');
            }, 350);
            setTimeout(() => {
                chatContainer.classList.remove('hideable-hide');
                chatContainer.classList.add('hideable-show');
            }, 400);
        }
        // Toggle card header border class
        var cardHeader = chatCard.querySelector('.card-header');
        if (cardHeader.classList.contains('border-0')) {
            cardHeader.classList.remove('border-0');
        } else {
            setTimeout(() => {
                cardHeader.classList.add('border-0');
            }, 100);
        }
        // Rotate this button 45 degrees
        this.classList.toggle('rotate-45');
    });

    // Event listener for collapse histogram chart button
    var collapseHistogramChartButton = document.getElementById('buttonCloseHistogram');
    collapseHistogramChartButton.addEventListener('click', function () {
        // Toggle card header border class
        var histogramCard = document.getElementById('histogram-card');
        var cardHeader = histogramCard.querySelector('.card-header');
        if (cardHeader.classList.contains('border-0')) {
            cardHeader.classList.remove('border-0');
        } else {
            setTimeout(() => {
                cardHeader.classList.add('border-0');
            }, 300);
        }
        // Rotate this button 45 degrees
        this.classList.toggle('rotate-45');
    });
}

function detectScrollingChat() {
    let currentScroll = this.scrollTop;
    if (currentScroll > lastChatScroll) {
        // Scrolling down
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 400) {
            // console.debug('Near bottom of chat reached');
            addMessagesToChatBottom();
        }
    } else {
        // Scrolling up
        if (this.scrollTop <= 400) {
            // console.debug('Near top of chat reached');
            addMessagesToChatTop();
        }
    }
    lastChatScroll = currentScroll <= 0 ? 0 : currentScroll;
}

function setChatScrollEventListeners() {
    var chatList = document.getElementById('chat');
    chatList.addEventListener('scroll', detectScrollingChat);
    console.debug('Scroll chat event added');
}

function clearChatScrollEventListeners() {
    var chatList = document.getElementById('chat');
    chatList.removeEventListener('scroll', detectScrollingChat);
    console.debug('Scroll chat event removed');
}



// ************************************************************
// ************************************************************
//                  Función principal
// ************************************************************
// ************************************************************

async function main() {
    // Check if chat content is null
    if (sessionStorage.getItem('chat_file_content') === null) {
        clearChatSessionStorage();
        window.location.href = basePathname + '/no_file';
    }


    // Page loading spinner
    // Appears by default


    // Get chat content from session storage
    chat_content = sessionStorage.getItem('chat_file_content');

    // Check if first load after upload and show success toast
    if (sessionStorage.getItem('first_load_after_upload') === 'true') {
        // showToastSuccess('Archivo cargado correctamente');
        analisisCountCallPending = true;
        sessionStorage.setItem('first_load_after_upload', 'false');
    }

    // Set chat title
    var chatTitle = document.getElementById('chat-title');
    chatDisplayName = sessionStorage.getItem('chat_file_name');
    if (chatDisplayName.endsWith('.txt')) {
        chatDisplayName = chatDisplayName.slice(0, -4);
    }
    if (chatDisplayName.length > 75) {
        chatTitle.style.fontSize = 'large';
    }

    if (chatDisplayName.length > 90) {
        chatTitle.style.fontSize = 'medium';
    }
    chatTitle.innerText = chatDisplayName;

    // Parse messages
    // Check if messages data is in session storage
    if (sessionStorage.getItem('messages_data') !== null) {
        messagesParsedData = JSON.parse(sessionStorage.getItem('messages_data'));
    } else {
        await parseMessages();
    }

    startAnalysis();

}



// ************************************************************
// ************************************************************
//                  Funciones de análisis
// ************************************************************
// ************************************************************

async function parseMessages() {
    let parseMessagesTimeStart = performance.now();
    try {
        messagesParsedData = whatsappChatParser.parseString(chat_content);

        if (messagesParsedData.length < 1) {
            console.log('Error: No se encontraron mensajes en el archivo.');
            clearChatSessionStorage();
            window.location.href = basePathname + '/no_messages';
            return;
        }
        // Guarda en sessionStorage los datos del chat
        sessionStorage.setItem('messages_data', JSON.stringify(messagesParsedData));

        registerNewAnalysis();

    } catch (error) {
        console.error('Error:', error);
    }
    console.debug('Parse messages time:', (performance.now() - parseMessagesTimeStart).toFixed(1) + ' ms');
}

function registerNewAnalysis() {
    // POST Call para registrar el nuevo análisis
    if (analisisCountCallPending) {
        fetch(basePathname + '/new_analisis', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ counter: 1 }),
        })
            .then(response => {
                if (response.ok) {
                    analisisCountCallPending = false;
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }
}

async function prepareData() {
    let timeStart = performance.now();

    // Obtiene los contactos únicos
    uniqueContacts = messagesParsedData.map(function (item) {
        return item.author;
    }).filter(onlyUnique);

    uniqueContacts.map( name => {
        messagesByMemberCounts[name] = 0;
    });

    generateColors();

    // Itera sobre los mensajes para ordenarlos por fecha
    for (var i = 0; i < messagesParsedData.length; i++) {
        // New approach
        let msg_date = new Date(messagesParsedData[i].date);

        let year = msg_date.getFullYear();
        if (!messageIDsByDate[year]) {
            messageIDsByDate[year] = {};
        }

        let month = msg_date.getMonth();
        if (!messageIDsByDate[year][month]) {
            messageIDsByDate[year][month] = {};
        }

        let day = msg_date.getDate();
        if (!messageIDsByDate[year][month][day]) {
            messageIDsByDate[year][month][day] = [];
        }

        messageIDsByDate[year][month][day].push(i);

        messagesByMemberCounts[messagesParsedData[i].author]++;


        // console.debug(messages_data[i]);

        // Old approach
        // Obtiene la fecha del mensaje en formato DD MM
        msg_day_month = formatWhatsappDayMonth(messagesParsedData[i].date);

        // Si no existe el arreglo de mensajes para esta fecha, lo crea
        if (!messages_by_day_month[msg_day_month]) {
            messages_by_day_month[msg_day_month] = [];
        }

        // Agrega el mensaje al arreglo de mensajes de la fecha actual
        messages_by_day_month[msg_day_month].push(messagesParsedData[i].message);

        // Si no existe la fecha en el arreglo de fechas, la agrega
        if (!dates_day_month.includes(msg_day_month)) {//Si la fecha actual no existe en la lista lo guarda
            dates_day_month.push(msg_day_month);//guarda la fecha en formato DD MM
        }
    }

    // Inicializa los contadores de mensajes por categoría para cada día
    for( let i = 0; i < dates_day_month.length; i++) {
        category_counts_by_day.LOGISTICA[dates_day_month[i]] = 0;
        category_counts_by_day.CODIGO[dates_day_month[i]] = 0;
        category_counts_by_day.INTRASCENDENTE[dates_day_month[i]] = 0;
    }

    // Crea la matriz de relaciones
    relationships = createRelationshipMatrix(uniqueContacts);

    let timeEnd = performance.now();
    console.log('Data prep time: ' + ((timeEnd - timeStart)).toFixed(1) + ' ms');
}

async function generateColors() {
    let colorsTime = performance.now();

    let colorsTemp = [];
    for (let i = 0; i < uniqueContacts.length; i++) {
        let hue = Math.floor(i * (360 / uniqueContacts.length));
        let color = `hsl(${hue}, 50%, 50%)`;
        colorsTemp.push(color);
    }

    // Shuffle colors
    colorsTemp.sort(() => Math.random() - 0.5);
    colors = colorsTemp;

    console.debug('Colors time:', (performance.now() - colorsTime).toFixed(1) + ' ms');
}

async function getMesssageClassification(message_data) {
    try {
        var response = await fetch(basePathname + '/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message_data.message })
        });

        var data = await response.json();

        // Imprime el mensaje y su clasificación en consola
        // console.debug(' ');
        // console.debug('📅', formatWhatsappDayMonth(message_data.date));
        // let cat_icon = data.category == 'Logistica' ? '🗣️' : data.category == 'Codigo' ? '🧑‍💻' : data.category == 'Intrascendente' ? '🎲' : '🤷';
        // console.debug(cat_icon, data.category);
        // console.debug(data.scores);
        // console.debug('💬', message_data.message);
        // console.debug(' ');

        return data;
    } catch (error) {
        console.error('Message Classification Error:', error);
    }
}

async function getMessageBatchClassification(messages_data) {
    try {
        var response = await fetch(basePathname + '/classify_batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: messages_data })
        });

        var data = await response.json();

        return data;

    } catch (error) {
        console.error('Message Batch Classification Error:', error);
    }
}

async function stopAnalysis() {
    shouldStopAnalysis = true;
    while (!chordAnalysisFinished || !semanticAnalysisFinished) {
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

async function startAnalysis() {
    shouldStopAnalysis = false;
    chordAnalysisFinished = false;
    semanticAnalysisFinished = false;

    $(chatContainerID).empty();
    $(chordParentID).empty();
    $(histogramCanvasID).addClass('d-none');
    $(histogramProgressBarID).removeClass('d-none');

    // Prepare data
    await prepareData();

    // Ajusta el número de mensajes en la pantalla
    messageDisplayCount = 0;
    $(chatMessagesCountID).text(messageDisplayCount);
    // Ajusta el número de contactos en la pantalla
    $(chatMembersCountID).text(uniqueContacts.length);

    // Remove loading spinner
    $(loadingSpinnerID).addClass('hide-spinner');

    // Analizar chat y generar gráficos asíncronamente
    analyzeChatAndGenerateCharts();

    // Wait for analysis to finish
    checkAndWaitForAnalysis();
}

async function restartAnalysis() {
    // Add loading spinner
    $(loadingSpinnerID).removeClass('hide-spinner');

    await stopAnalysis();
    
    setTimeout(() => {
        startAnalysis();
    }, 500);
}

async function checkAndWaitForAnalysis() {
    while (!chordAnalysisFinished || !semanticAnalysisFinished) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (shouldStopAnalysis) {
        console.log('Analysis stopped');
        return;
    } else {
        showToastSuccess('Se completó el análisis del chat');
        return;
    }
}

async function analyzeChatAndGenerateCharts() {
    // Start semantic analysis asynchronously
    semanticAnalysisV2();

    clearChatScrollEventListeners();
    $(chatContainerID).addClass('no-scrollbar');

    // Analyze and generate charts await asynchronously
    await makeChordAndChatDynamic();

    if (virtualScrolling) setChatScrollEventListeners();
    $(chatContainerID).removeClass('no-scrollbar');
    makeSVGHoverable();
    duplicateChordLabels();
}

// TODO: clear unused vars
async function makeChordAndChatDynamic() {
    var analysisStartTime = performance.now();

    msgIdealTime = totalAnimationTime / messagesParsedData.length;
    msgIdealTime = Math.min(Math.max(msgIdealTime, minMsgDelay), maxMsgDelay);
    msgAimTime = Math.max(msgIdealTime, msgProcTime);

    batchSize = Math.ceil(updateInterval / msgAimTime);
    batchAimTime = updateInterval;
    
    insertFirstMessageInChat(messagesParsedData[0], messagesParsedData[0].author);

    let fragment = "";
    batchMsgCount = 0;
    batchProcTime = 0;
    let batchStartTime = performance.now();

    let chordUpdateFrequency = 1;
    let chordUpdateCount = 0;

    for (let i = 1; i < messagesParsedData.length && !shouldStopAnalysis; i++) {
        let timeStartMsg = performance.now();

        // Update relationships
        previous_msg_author_index = current_msg_author_index;
        current_msg_author_index = uniqueContacts.indexOf(messagesParsedData[i].author);
        let author_same_as_previous = previous_msg_author_index == current_msg_author_index;
        if (!author_same_as_previous)
            relationships[previous_msg_author_index][current_msg_author_index]++;
        
        // Append message to fragment
        let message = makeMessage(messagesParsedData[i], current_msg_author_index, author_same_as_previous, i);
        fragment += message;

        let updateView = ++batchMsgCount % batchSize == 0;

        if (updateView) {
            // Append fragment to chat container and reset it
            $(chatContainerID).append(fragment);
            fragment = "";
            batchMsgCount = 0;

            // Scroll to bottom of chat
            $(chatContainerID).stop(true, true);
            $(chatContainerID).animate({ scrollTop: $(chatContainerID)[0].scrollHeight }, batchProcTime);

            if(chordUpdateCount++ % chordUpdateFrequency == 0) { // Update chord diagram
                // Remove contacts with no relationships
                let tempUniqueContacts = [];
                let tempRelationships = [];
                for (let j = 0; j < relationships.length; j++) {
                    let sum = relationships[j].reduce((a, b) => a + b, 0);
                    if (sum != 0) {
                        tempUniqueContacts.push(uniqueContacts[j]);
                        tempRelationships.push(relationships[j]);
                    }
                }

                // Update chord diagram
                let chordTimeStart = performance.now();
                $(chordParentID).empty();
                makeChordDiagram(tempRelationships, tempUniqueContacts, colors, false, chordParentID);
                chordProcTime = performance.now() - chordTimeStart;

                chordUpdateFrequency = Math.max(1, Math.ceil(chordProcTime / 15));
            }
            
            // Adjust times for performance
            batchProcTime = performance.now() - batchStartTime;
            batchStartTime = performance.now();
            let avgMsgProcTime = msgProcTimes.reduce((a, b) => a + b, 0) / msgProcTimes.length;
            msgProcTimes = [avgMsgProcTime];
            msgAimTime = (avgMsgProcTime + avgMsgProcTime + msgIdealTime + msgAimTime) / 4;
            batchSize = Math.max(Math.ceil(updateInterval / msgAimTime), 1);
            if (batchProcTime < updateInterval) {
                batchSize += 2;
            }

            reduceChatList();
        }

        $(chatMessagesCountID).text(++messageDisplayCount);

        await new Promise(resolve => setTimeout(resolve, msgIdealTime));

        if (!updateView) {
            msgProcTime = performance.now() - timeStartMsg;
            msgProcTimes.push(msgProcTime);
        }
    }

    if (shouldStopAnalysis) {
        console.log('Chord analysis stopped');
        chordAnalysisFinished = true;
        return;
    }

    $(chatContainerID).append(fragment);
    $(chatContainerID).animate({ scrollTop: $(chatContainerID)[0].scrollHeight }, batchAimTime);
    $(chordParentID).empty();
    makeChordDiagram(relationships, uniqueContacts, colors, true, chordParentID);

    updateVisibleMessageIDs();

    let analysisTime = performance.now() - analysisStartTime;
    console.log('(Dynamic V3) Execution time: ' + ((analysisTime)/1000).toFixed(1) + ' s');
    chordAnalysisFinished = true;
    return;
}

async function semanticAnalysis() {
    let startSemanticAnalysisTime = performance.now();

    let chart_dates = [];
    let current_msg_date = dates_day_month[0];
    let prev_msg_date = dates_day_month[0];
    // Itera sobre todos los mensajes
    for (var i = 0; i < messagesParsedData.length && !shouldStopAnalysis; i++) {

        class_data = await getMesssageClassification(messagesParsedData[i]);
        // Guarda la clasificación del mensaje
        message_classifications[i] = class_data;

        // Obtiene la fecha del mensaje en formato DD MM
        var msg_day_month = formatWhatsappDayMonth(messagesParsedData[i].date);

        current_msg_date = msg_day_month;

        // Incrementa el contador de mensajes por categoría para este día
        category_counts_by_day[class_keys[class_data.class]][msg_day_month]++;

        if (current_msg_date != prev_msg_date) {

            chart_dates.push(current_msg_date);

            // Genera el gráfico de barras con los datos obtenidos
            generateChart(chart_dates, category_counts_by_day);
            // Muestra canvas
            $(histogramCanvasID).removeClass('d-none');
            // Oculta progress bar
            $(histogramProgressBarID).addClass('d-none');
        }

        prev_msg_date = current_msg_date;
    }

    if (shouldStopAnalysis) {
        console.log('Semantic analysis stopped');
        semanticAnalysisFinished = true;
        return;
    }

    // Guarda en sessionStorage los datos del analisis
    var category_counts_by_day_json = JSON.stringify(category_counts_by_day);
    sessionStorage.setItem('category_counts_by_day', category_counts_by_day_json);

    // Genera el gráfico de barras con los datos obtenidos
    generateChart(dates_day_month, category_counts_by_day, true);
    // Muestra canvas
    $(histogramCanvasID).removeClass('d-none');
    // Oculta progress bar
    $(histogramProgressBarID).addClass('d-none');

    let executionSemanticAnalysisTime = performance.now() - startSemanticAnalysisTime;
    console.log('Semantic analysis time: ' + ((executionSemanticAnalysisTime)/1000).toFixed(1) + ' s');
    
    semanticAnalysisFinished = true;
    return;
}

async function semanticAnalysisV2() {
    let startSemanticAnalysisTime = performance.now();

    var color1 = "#1a88d6"; // Logística
    var color2 = "#2cb983"; // Código
    var color3 = "#eed27a"; // Intrascendente

    barChartLabels = [];
    barChartDatasets = [
        {
            label: 'Logística',
            color: color1,
            colorSemiTransparent: color1 + 'C0',
            data: [],
        },
        {
            label: 'Código',
            color: color2,
            colorSemiTransparent: color2 + 'C0',
            data: [],
        },
        {
            label: 'Intrascendente',
            color: color3,
            colorSemiTransparent: color3 + 'C0',
            data: [],
        }
    ];

    createStackedBarChart(barChartDatasets, barChartLabels, 'Distribución de categorías por día', true);
    // Muestra canvas
    $(histogramCanvasID).removeClass('d-none');
    // Oculta progress bar
    $(histogramProgressBarID).addClass('d-none');

    for (const year in messageIDsByDate) {
        for (const month in messageIDsByDate[year]) {
            for (const day in messageIDsByDate[year][month]) {
                let date = new Date(year, month, day);
                let label = date.toLocaleDateString('default', {day: '2-digit', month: 'short', year: 'numeric'});
                let msgs = [];
                msgs = messageIDsByDate[year][month][day].map(id => messagesParsedData[id].message);

                let batch_class_data = await getMessageBatchClassification(msgs);

                // Save classification data for each message by ID
                messageIDsByDate[year][month][day].map((id, index) => {
                    classificationData[id] = batch_class_data[index];
                });

                let class_counts = {
                    0: 0,
                    1: 0,
                    2: 0
                };

                // Increment class counts for each message
                batch_class_data.map(data => {
                    class_counts[data.class]++;
                });

                // Save class counts for each day
                barChartDatasets[0].data.push(class_counts[0]);
                barChartDatasets[1].data.push(class_counts[1]);
                barChartDatasets[2].data.push(class_counts[2]);

                barChartLabels.push(label);
                label = "";

                if (shouldStopAnalysis) break;

                // Update chart
                classChart.update();
            
            }
            if (shouldStopAnalysis) break;   
        }
        if (shouldStopAnalysis) break;
    }

    if (shouldStopAnalysis) {
        console.log('Semantic analysis V2 stopped');
        semanticAnalysisFinished = true;
        return;
    }

    let executionSemanticAnalysisTime = performance.now() - startSemanticAnalysisTime;
    console.log('Semantic analysis V2 time: ' + ((executionSemanticAnalysisTime) / 1000).toFixed(1) + ' s');

    semanticAnalysisFinished = true;
    return;
}



// ************************************************************
// ************************************************************
//                  Funciones del chat
// ************************************************************
// ************************************************************

function insertFirstMessageInChat(message_data, author) {
    let author_index = uniqueContacts.indexOf(author);

    let message = makeMessage(message_data, author_index, false, 0);

    $(chatContainerID).append(message);

    $(chatMessagesCountID).text(++messageDisplayCount);
}

async function reduceChatList() {
    // if chatContainerID child count is greater than 500, remove first 300
    if ($(chatContainerID).children().length > 500) {
        $(chatContainerID).children().slice(0, 300).remove();
        virtualScrolling = true;
        console.debug('Reduced chat list');
        updateVisibleMessageIDs();
    }
}

function updateVisibleMessageIDs() {
    firstVisibleMessageID = parseInt($(chatContainerID).children().first().attr('data-id'));
    lastVisibleMessageID = parseInt($(chatContainerID).children().last().attr('data-id'));
    // console.debug('Visible messages: ', firstVisibleMessageID, " - ", lastVisibleMessageID);
}

function addMessagesToChatTop() {
    if (firstVisibleMessageID == 0) return;
    let newTopMessageID = Math.max(0, firstVisibleMessageID - 10);
    for (let i = firstVisibleMessageID - 1; i >= newTopMessageID; i--) {
        let same_as_previous = i == 0 ? false : uniqueContacts.indexOf(messagesParsedData[i].author) == uniqueContacts.indexOf(messagesParsedData[i - 1].author);
        let message = makeMessage(messagesParsedData[i], uniqueContacts.indexOf(messagesParsedData[i].author), same_as_previous, i);
        $(chatContainerID).prepend(message);
    }
    $(chatContainerID).children().slice(-10).remove();
    updateVisibleMessageIDs();
}

function addMessagesToChatBottom() {
    if (lastVisibleMessageID == messagesParsedData.length - 1) return;
    let newBottomMessageID = Math.min(messagesParsedData.length - 1, lastVisibleMessageID + 10);
    for (let i = lastVisibleMessageID + 1; i <= newBottomMessageID; i++) {
        let same_as_previous = i == 0 ? false : uniqueContacts.indexOf(messagesParsedData[i].author) == uniqueContacts.indexOf(messagesParsedData[i - 1].author);
        let message = makeMessage(messagesParsedData[i], uniqueContacts.indexOf(messagesParsedData[i].author), same_as_previous, i);
        $(chatContainerID).append(message);
    }
    $(chatContainerID).children().slice(0, 10).remove();
    updateVisibleMessageIDs();
}



// ************************************************************
// ************************************************************
//               Gráfica de barras (Histograma)
// ************************************************************
// ************************************************************

async function createStackedBarChart(datasets, dataLabels, title = null, animate = false) {

    var canvasContext = document.getElementById(histogramCanvasIDNoHashtag).getContext('2d');

    // Configuration
    var configuration = {
        //Tipo de gráfico de barras
        type: 'bar',
        //Datos para el conjunto de datos del gráfico
        data: {
            labels: dataLabels,   //Etiquetas en el eje X (días)
            datasets: datasets.map(dataset => {
                return {
                    label: dataset.label,
                    backgroundColor: dataset.colorSemiTransparent,
                    data: dataset.data,
                    stack: 'Stack 0',
                    hoverBackgroundColor: dataset.color
                }
            })
        },

        //Opciones de configuración
        options: {
            animation: animate,
            plugins: {
                title: {
                    display: title !== null,
                    text: title !== null ? title : "Gráfico de barras",
                    font: {
                        size: 16
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },

            },
            layout: {
                padding: {
                    bottom: 20
                }
            },
            responsive: true,       //Hace el gráfico responsive
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: false,
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false,
                    }
                },
                y: {
                    stacked: true,   //Apila las barras en el eje Y
                    title: {
                        display: true,
                        text: "Número de mensajes",
                        font: {
                            size: 14
                        },
                    },
                    grid: {
                        display: true,
                        color: '#c0c0c040'
                    },
                    border: {
                        display: true,
                        color: '#c0c0c040'
                    }
                }
            }
        }
    };

    if (typeof classChart !== "undefined") {
        classChart.destroy();
    }

    //Crea una nueva instancia de Chart.js, configurando un gráfico de barras apiladas
    classChart = new Chart(canvasContext, configuration);
}

/**
 * Genera el gráfico de barras con los datos obtenidos.
 * @param {*} days  Los días que se desean mostrar en el gráfico.
 * @param {*} category_counts_by_day  Los mensajes por categoría por día.
 */
function generateChart(days, category_counts_by_day, animate = false) {

    var ctx = document.getElementById(histogramCanvasIDNoHashtag).getContext('2d');

    const codigo = days.map(day => category_counts_by_day.CODIGO[day]);
    const organizacion = days.map(day => category_counts_by_day.LOGISTICA[day]);
    const intrascendente = days.map(day => category_counts_by_day.INTRASCENDENTE[day]);

    // Colores aleatorios
    // color_index = Math.floor(Math.random() * colors.length);
    // var color1 = colors[color_index % colors.length];
    // var color2 = colors[(color_index + 1) % colors.length];
    // var color3 = colors[(color_index + 2) % colors.length];
    // var color1 = "#C6DE89";
    // var color2 = "#eed27a";
    // var color3 = "#d4d4d4";
    var color1 = "#1a88d6"; // Logística
    var color2 = "#2cb983"; // Código
    var color3 = "#d4d4d4"; // Instrascendente

    // Configuration
    var configuration = {
        //Tipo de gráfico de barras
        type: 'bar',
        //Datos para el conjunto de datos del gráfico
        data: {
            labels: days,   //Etiquetas en el eje X (días)
            datasets: [
                {
                    label: 'Logística',         //Etiqueta para el conjunto de datos
                    backgroundColor: color1,    //Color de las barras
                    data: organizacion,         //Datos para este conjunto
                    stack: 'Stack 0',           //Define la pila a la que pertenecerán las barras
                },
                {
                    label: 'Código',
                    backgroundColor: color2,
                    data: codigo,
                    stack: 'Stack 0',
                },
                {
                    label: 'Intrascendente',
                    backgroundColor: color3,
                    data: intrascendente,
                    stack: 'Stack 0',
                }
            ]
        },

        //Opciones de configuración
        options: {
            animation: animate,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de mensajes en el tiempo, por categoría'
                },
            },
            responsive: true,       //Hace el gráfico responsive
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    stacked: true,  //Apila las barras en el eje X
                },
                y: {
                    stacked: true   //Apila las barras en el eje Y
                }
            }
        }
    };

    if (typeof classChart !== "undefined") {
        classChart.destroy();
    }

    //Crea una nueva instancia de Chart.js, configurando un gráfico de barras apiladas
    classChart = new Chart(ctx, configuration);
}



// ************************************************************
// ************************************************************
//                       Chord Diagram
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
    var svg = d3.select(chordParentID).select("svg").node();

    if (svg) {
        d3.select(chordParentID).select("svg").remove();
    }
    await makeChordDiagram(relationships, uniqueContacts, colors, true, chordParentID);
    makeSVGHoverable();
    duplicateChordLabels();
}

function calculateViewBox(svgElement) {
    var paths = svgElement.querySelectorAll('path');
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    paths.forEach(function (path) {
        var d = path.getAttribute('d');
        var points = d.match(/[-+]?\d*\.\d+|\d+/g).map(Number);

        for (var i = 0; i < points.length; i += 2) {
            var x = points[i];
            var y = points[i + 1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    });

    return { minX, minY, width: maxX - minX, height: maxY - minY };
}

function makeSVGHoverable() {

    $(chordParentID).find('svg').each(function (index, svg) {
        svg.classList.add('hoverable');
    });

    // Habilita el hover en las etiquetas del diagrama de cuerdas
    Array.from($(chordParentID).find('.chordLabel')).forEach(function (label) {
        label.classList.add('hoverable');
    });
}

// Duplica cada nombre en el diagrama de cuerdas
// para añadir stroke y mejorar la legibilidad
function duplicateChordLabels() {
    const chordLabels = document.querySelectorAll('.chordLabel');

    chordLabels.forEach((label) => {
        const duplicateLabel = label.cloneNode(true);
        duplicateLabel.classList.add('duplicate');

        label.parentNode.insertBefore(duplicateLabel, label);

        label.addEventListener('mouseover', () => {
            duplicateLabel.classList.add('hover');
        });

        label.addEventListener('mouseout', () => {
            duplicateLabel.classList.remove('hover');
        });
    });
}

function downloadChordSVG() {
    var svg = document.getElementById('chord-chart-container').querySelector('svg');

    if (!svg) {
        showToastError('No se pudo descargar el diagrama de cuerdas');
        return;
    }

    var svgData = new XMLSerializer().serializeToString(svg);

    var parser = new DOMParser();
    var svgDoc = parser.parseFromString(svgData, "image/svg+xml");

    var viewBox = calculateViewBox(svgDoc.documentElement);

    svg_copy = svg.cloneNode(true);

    svg_copy.setAttribute('viewBox', `${viewBox.minX * 2.0} ${viewBox.minY * 2.0} ${viewBox.width * 2.0} ${viewBox.height * 2.0}`);
    svg_copy.setAttribute('width', '100%');
    svg_copy.setAttribute('height', '100%');
    svg_copy.querySelector('g').removeAttribute('transform');

    var svgData = new XMLSerializer().serializeToString(svg_copy);
    var blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

    svg_copy = null;

    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    let datetime = new Date().toLocaleString().
        replace(/:/g, '-').
        replace(/\//g, '-').
        replace(/,/g, '');
    let fileName = chatDisplayName + ' ' + datetime + '.svg';
    a.download = fileName

    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}



// ************************************************************
// ************************************************************
//                       Funciones GUI
// ************************************************************
// ************************************************************

function startResizeContents() {
    $(chordParentID).removeClass('hideable-show');
    $(chordParentID).addClass('hideable-hide');
    $(histogramParentID).removeClass('hideable-show');
    $(histogramParentID).addClass('hideable-hide');
}

function resizeContents() {
    startResizeContents();

    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
        resizeChordDiagram();
        $(chordParentID).removeClass('hideable-hide');
        $(chordParentID).addClass('hideable-show');
        classChart.update();
        $(histogramParentID).removeClass('hideable-hide');
        $(histogramParentID).addClass('hideable-show');
    }, 300);
}

function populateMembersTable() {
    let memberTableTimeStart = performance.now();

    if (uniqueContacts.length == 0) return;

    var table = document.getElementById(membersTableBodyIDNoHashtag);
    table.innerHTML = '';

    let messageCountTuples = Object.entries(messagesByMemberCounts);
    messageCountTuples.sort((a, b) => b[1] - a[1]);

    messageCountTuples.forEach((memberCount) => {
        let row = table.insertRow();
        let color = row.insertCell(0);
        let colorIndex = uniqueContacts.indexOf(memberCount[0] == 'null' ? null : memberCount[0]);
        color.innerHTML = '<i class="fa-solid fa-comment"></i>';
        color.setAttribute('style', `color: ${colors[colorIndex % colors.length]}`);
        color.setAttribute('class', 'text-center');

        let nombre = row.insertCell(1);
        nombre.innerHTML = memberCount[0] == 'null' ? 'System' : memberCount[0];
        nombre.setAttribute('scope', 'row');

        let mensajes = row.insertCell(2);
        mensajes.innerHTML = memberCount[1];
        mensajes.setAttribute('class', 'text-center');
    });

    console.debug('Members table time: ' + ((performance.now() - memberTableTimeStart)).toFixed(1) + ' ms');
}



// ************************************************************
// ************************************************************
//                  Funciones auxiliares
// ************************************************************
// ************************************************************

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
function makeMessage(message_data, author_index, author_same_as_previous, message_id = null) {
    var message = `<div class="msg {0}" id=msg-${message_id} data-id=${message_id}>
						<div class="bubble {1}">
                            {2}
                            <div class="bubble-message {3}">${escapeHtml(message_data.message)}</div>
                            <div class="bubble-footer">
                                <span class="bubble-class"></span>
                                <span class="bubble-timestamp">${formatWhatsappDate(message_data.date)}</span>
                            </div>
						</div>
					</div>`;
    if (message_data.author == null) // If message is a system message
        if (author_same_as_previous)
            return message.format("", "system", "", "");
        else return message.format("first", "system first", `<span class="msg-bubble-name system">System</span>`,
            "");
    else if (author_same_as_previous)
        return message.format("", "", "", "");
    else {
        var coloredContact = `<span class="msg-bubble-name"
					style="color: ${colors[author_index % colors.length]}">${message_data.author}</span>`;
        return message.format("first", "first", coloredContact, "");
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