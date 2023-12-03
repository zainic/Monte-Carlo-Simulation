var data = {};
var chosenData = null;
var insample = null;
var outsample = null;
var listOfRNG = [];

var allPrediction = null;
var insamplePrediction = null;
var outsamplePrediction = null;

var errorInput = document.querySelector("#warning-csv");
var successInput = document.querySelector("#warning-success");
var loadError = document.querySelector("#warning-read");
var predictionInput = document.querySelector(".input-parameter");
var readButton = document.querySelector("#read");
var columnSelector = document.querySelector("#columns");
var dataTable = document.querySelector("#data-table");
var frequencyTable = document.querySelector("#frequency");
var infoTable = document.querySelector(".info");
var graphBox = document.querySelector(".graph-box");
var validCheck = document.querySelector("#valid-check")
var graphPlace = document.querySelector(".graph");
var tableBox = document.querySelector("#result-table");
var outerTableBox = document.querySelector(".result-box");
var resultButton = document.querySelector("#result");

var insampleMapeBox = document.querySelector("#insample-mape");
var outsampleMapeBox = document.querySelector("#outsample-mape");
var overallMapeBox = document.querySelector("#overall-mape");

var reader = new FileReader();

function loadCSV() {
    infoTable.textContent = '';
    setOff(outerTableBox);
    setOff(resultButton);
    setOff(validCheck);
    setOff(graphBox);
    setOff(dataTable);
    setOff(frequencyTable);
    setOff(infoTable);
    setOff(loadError);
    setOff(successInput);
    var file = document.getElementById("file-upload").files[0];
    if (!/\.csv$/.test(file.name)){
        setOn(errorInput);
        setOff(predictionInput);
        setOff(readButton);
    }
    else{
        reader = new FileReader();
        reader.readAsText(file);
        setOff(errorInput);
        setOn(readButton);
        setOn(successInput);
    }
}

function readCSV() {
    var fileContent = reader.result;
    if (fileContent){
        fileContent = fileContent.split('\r\n').map(item => item.split(','));
        columns = fileContent.shift();
        fileContent = fileContent.filter(item => item.length === columns.length);
        data = {};
        for (let i=0; i<columns.length; i++){
            data[columns[i]] = fileContent.map(item => item[i])
        }
        infoTable.textContent = "Showing 15 data out of " + data[Object.keys(data)[0]].length;
        setColumnChooser(columns);
        createTable(data, dataTable, 15);
        setOn(infoTable)
        setOff(errorInput);
        setOff(loadError);
        setOn(predictionInput);
    }
    else {
        setOn(loadError);
    }
}

function setOn(tag) {
    tag.style.display = "block";
}

function setOff(tag) {
    tag.style.display = "none";
}

function setColumnChooser(columns) {
    clearColumnChooser();
    for (var column of columns){
        var newColumn = document.createElement('option');
        newColumn.textContent = column;
        columnSelector.appendChild(newColumn);
    }
}

function clearColumnChooser() {
    while(columnSelector.childElementCount > 1){
        columnSelector.removeChild(columnSelector.lastChild);
    }
}

function createTable(data, dataTable, maxRow=null) {
    setOn(dataTable);
    dataTable.textContent = '';
    var columns = Object.keys(data);
    // create header
    var header = document.createElement('tr');
    for (var column of columns){
        var headChild = document.createElement('th');
        headChild.textContent = column;
        header.appendChild(headChild);
    }
    dataTable.appendChild(header);
    // elements
    if (maxRow === null) {
        maxRow = data[Object.keys(data)[0]].length;
    }
    for (let i=0; i<maxRow; i++){
        var row = document.createElement('tr');
        for (var column of columns){
            var rowChild = document.createElement('td');
            rowChild.textContent = data[column][i];
            row.appendChild(rowChild);
        }
        dataTable.appendChild(row);
    }
}

function createPrediction() {
    var columnPredict = document.querySelector("#columns").value;
    var mPredict = Number(document.querySelector("#number-m").value);
    var aPredict = Number(document.querySelector("#number-a").value);
    var cPredict = Number(document.querySelector("#number-c").value);
    var seedPredict = Number(document.querySelector("#seed").value);
    var outsamplePercentage = Number(document.querySelector("#outsample").value);
    if ((columnPredict && mPredict && aPredict && cPredict && seedPredict && outsamplePercentage) === ''){
        setOn(validCheck);
        return null;
    }
    chosenData = data[columnPredict];
    var nData = chosenData.length;
    var nInsample = Math.round(nData*(100-outsamplePercentage)/100);
    var nOutsample = Math.round(nData*outsamplePercentage/100);
    insample = chosenData.slice(0, nInsample);
    outsample = chosenData.slice(nInsample);
    var tableFrequency = createFrequencyTable(insample);
    var isValid = checkValidity(mPredict, aPredict, cPredict);
    if (!isValid){
        setOn(validCheck);
        return null;
    }
    setOff(validCheck);
    setOn(graphBox);
    var prediction = predict(mPredict, aPredict, cPredict, seedPredict, tableFrequency, nData);
    allPrediction = structuredClone(prediction);
    insamplePrediction = prediction.slice(0, nInsample);
    outsamplePrediction = prediction.slice(nInsample);
    createPredictionGraph(outsamplePrediction, outsample, graphPlace);
    changeGraph();
    setOn(resultButton);
    setOff(outerTableBox);
}

function predict(m, a, c, seed, table, totalPrediction){
    var prediction = [];
    listOfRNG = [];
    var tagNumbers = [0].concat(table['Tag']);
    var x = seed;
    var numberClass = table[Object.keys(table)[0]].length;
    for (let i=0; i<totalPrediction; i++){
        x = (a*x + c) % m;
        listOfRNG.push(x);
        for (let j=0; j<numberClass; j++){
            if ((x >= tagNumbers[j]) && (x < tagNumbers[j+1])){
                prediction.push(table["Mid"][j])
                break;
            }
        }
    }
    return prediction;
}

function createFrequencyTable(series) {
    var tableFrequency = {};
    var nData = series.length;
    var maxData = Math.max(...series);
    var minData = Math.min(...series);
    var rangeData = maxData - minData;
    var numberClass = Math.round(1 + 3.3 * Math.log10(nData));
    var intervalClass = Math.round(rangeData/numberClass);
    tableFrequency['LB'] = [minData];
    tableFrequency['UB'] = [minData + intervalClass];
    for (i=1; i < numberClass; i++){
        tableFrequency['LB'].push(tableFrequency['UB'][i-1] + 1);
        tableFrequency['UB'].push(tableFrequency['LB'][i] + intervalClass);
    }
    tableFrequency['Mid'] = tableFrequency['LB'].map((value, i) => (value + tableFrequency['UB'][i])/2);
    tableFrequency['F'] = Array(numberClass).fill(0).map((value, i)=>{
        return series.filter(value => (value <= tableFrequency['UB'][i] && value >= tableFrequency['LB'][i])).length;
    });
    tableFrequency['CF'] = tableFrequency['F'].map((value, i, arr) => arr.slice(0, i + 1).reduce((a, b) => a + b));
    tableFrequency['Prob'] = tableFrequency['F'].map(value => Number((value/nData).toFixed(3)));
    tableFrequency['CumProb'] = tableFrequency['CF'].map(value => Number((value/nData).toFixed(3)));
    tableFrequency['Tag'] = tableFrequency['CumProb'].map(value => Math.round(value*1000));
    
    createTable(tableFrequency, frequencyTable);

    return tableFrequency;
}

function createPredictionGraph(prediction, actualData, graphPalace) {
    graphPalace.textContent = '';
    var graph = document.createElement('canvas');
    graphPalace.appendChild(graph);
    var ctx = graph.getContext('2d')
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: prediction.length}, (_, i) => i),
            datasets: [{
                label: 'Prediction',
                fill: false,
                data: prediction,
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                borderColor: 'rgba(255, 0, 0, 1)',
                borderWidth: 1,
                pointRadius: 0.5,
                pointHoverRadius: 1,
                lineTension: 0
            },{
                label: 'Real Data',
                fill: false,
                data: actualData,
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
                borderColor: 'rgba(0, 0, 255, 1)',
                borderWidth: 1,
                pointRadius: 0.5,
                pointHoverRadius: 1,
                lineTension: 0
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    }
                }]
            }
        }
    });
}

function changeGraph() {
    var changer = document.querySelector("#graph-selector").value;
    if (changer === "outsample"){
        createPredictionGraph(outsamplePrediction, outsample, graphPlace);
    }
    else if (changer === "insample"){
        createPredictionGraph(insamplePrediction, insample, graphPlace);
    }
    else if (changer === "allData"){
        createPredictionGraph(allPrediction, chosenData, graphPlace);
    }
    else{
        console.log("HOW DID YOU GET HERE?");
    }
}

function checkValidity(m, a, c){
    if (gcd(m, c) !== 1){
        return false;
    }
    uniquePrimes = new Set(primeFactors(m))
    for (prime of uniquePrimes){
        if (m % prime !== 0){
            return false;
        }
    }
    if ((a-1) % 4 !==0 || m % 4 !== 0){
        return false;
    }
    return true;
}

function gcd(a, b) {
    if (b === 0) {
        return a;
    } else {
        return gcd(b, a % b);
    }
}

function primeFactors(n) {
    const factors = [];
    let divisor = 2;

    while (n >= 2) {
        if (n % divisor == 0) {
            factors.push(divisor);
            n = n / divisor;
        } else {
            divisor ++;
        }
    }
    return factors;
}

function showResult() {
    setOn(outerTableBox);
    var resultTable = {};
    resultTable["Date"] = data["Date"];
    resultTable["i"] = Array.from({length: allPrediction.length}, (_, i) => i+1);
    resultTable["Z(i)"] = listOfRNG;
    resultTable["RealData"] = chosenData;
    resultTable["Prediction"] = allPrediction;
    resultTable["PercentageError"] = chosenData.map((value, i) => Number((Math.abs(value-allPrediction[i])/value).toFixed(3)));
    createTable(resultTable, tableBox);
    var nInsample = insamplePrediction.length;
    var nOutsample = allPrediction.length - nInsample;
    var insampleMape = Number((resultTable["PercentageError"].slice(0, nInsample).reduce((p, c) => p + c, 0)/nInsample).toFixed(4));
    var outsampleMape = Number((resultTable["PercentageError"].slice(nInsample).reduce((p, c) => p + c, 0)/nOutsample).toFixed(4));
    var overallMape = Number((resultTable["PercentageError"].reduce((p, c) => p + c, 0)/allPrediction.length).toFixed(4));
    insampleMapeBox.textContent = "MAPE for insample : " + (insampleMape*100).toFixed(3) + "%";
    outsampleMapeBox.textContent = "MAPE for outsample : " + (outsampleMape*100).toFixed(3) + "%";
    overallMapeBox.textContent = "MAPE for all data : " + (overallMape*100).toFixed(3) + "%";
}

