this.createWorld = function() {

  var width = 600,
  height = 600,
  sens = 0.25,
  focused;
  
  //Setting projection

  var projection = d3.geo.orthographic()
  .scale(300)
  .rotate([0, 0])
  .translate([width / 2, height / 2])
  .clipAngle(90);

  var path = d3.geo.path()
  .projection(projection);

  //SVG container

  var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("position", "fixed")
  .style("left", "50%")
  .style("top", "50%")
  .style("transform", "translate(-50%, -50%)");

  //Adding water

  svg.append("path")
  .datum({type: "Sphere"})
  .attr("class", "water")
  .attr("d", path)
  .call(d3.behavior.drag()
      .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
      .on("drag", function() {
        var rotate = projection.rotate();
        projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
        svg.selectAll("path.land").attr("d", path);
        svg.selectAll(".focused").classed("focused", focused = false);
      }));

  var countryTooltip = d3.select("body").append("div").attr("class", "countryTooltip"),
  countryList = d3.select("body").append("select").attr("name", "countries").attr("id", "countries");
  
  var yearList = d3.select("body").append("select").attr("name", "years").attr("id", "yearlist");
  var dataList = d3.select("body").append("select").attr("name", "data").attr("id", "datalist");


queue()
    .await(ready);

 function ready(error, world, countryData) {
	var data = new Data();
	world = data.world;
	countryData = data.countryData;
	var selectedCountries = [];
	var yearsData = ["2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012"];
	var typesOfData = ["Average Temperature Data", "Import Data", "Export Data"];
	
    var countryById = {};
	var chart;
    countries = topojson.feature(world, world.objects.countries).features;
	
    //Adding countries to select
    countryData.forEach(function(d) {
      countryById[d.id] = d.name;
      option = countryList.append("option");
      option.text(d.name);
      option.property("value", d.id);
    });
	
	yearsData.forEach(function(d) {
      option = yearList.append("option");
      option.text(d);
      option.property("value", d);
    });
	
	typesOfData.forEach(function(d) {
      option = dataList.append("option");
      option.text(d);
      option.property("value", d);
    });
	
    //Drawing countries on the globe
    var world = svg.selectAll("path.land")
    .data(countries)
    .enter().append("path")
    .attr("class", "land")
    .attr("d", path)

    //Drag event
    .call(d3.behavior.drag()
      .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
      .on("drag", function() {
        var rotate = projection.rotate();
        projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
        svg.selectAll("path.land").attr("d", path);
        svg.selectAll(".focused").classed("focused", focused = false);
      }))

    //Mouse events
    .on("mouseover", function(d) {
		var data = new Data()
		var year = document.getElementById('yearlist').selectedOptions[0].text;
		var dataType = getDataObjectName(document.getElementById('datalist').selectedOptions[0].text);
      countryTooltip.text(countryById[d.id] + ", " + (dataType == "avgTempCountryReformed" ? data[dataType][countryById[d.id]][year].toFixed(2) : data[dataType][countryById[d.id]][year]))
      .style("left", (d3.event.pageX + 7) + "px")
      .style("top", (d3.event.pageY - 15) + "px")
      .style("display", "block")
      .style("opacity", 1);
    })
    .on("mouseout", function(d) {
      countryTooltip.style("opacity", 0)
      .style("display", "none");
    })
    .on("mousemove", function(d) {
      countryTooltip.style("left", (d3.event.pageX + 7) + "px")
      .style("top", (d3.event.pageY - 15) + "px");
    })
	.on("click", function(d) {
		if (d3.event.defaultPrevented) return;
		var name = countryById[d.id];
		var index = selectedCountries.indexOf(name);
		
		if(index > -1) {
			var dataType = getDataObjectName(document.getElementById('datalist').selectedOptions[0].text);
			selectedCountries.splice(index, 1);
			if(data[dataType][name] && data[dataType][name][document.getElementById('yearlist').selectedOptions[0].text]){
				colorCountry(data[dataType][name], this, document.getElementById('yearlist').selectedOptions[0].text, dataType);
			} else {
				d3.select(this).style("fill", "#696969")
			}
		} else {
			selectedCountries.push(name);
			d3.select(this).style("fill", "#33CC33")
		}
		drawData(selectedCountries);
	});
	
	colorCountries("2001", "avgTempCountryReformed")
	
	function colorCountries(year, dataType){
		svg.selectAll('path.land').each(function(d,i) { 
			var name = countryById[d.id];
			var countryIsSelected = false;
			for(var i = 0; i < selectedCountries.length; i++) {
				if(selectedCountries[i] == name) {
					countryIsSelected = true;
					break;
				}
			}
			if(data[dataType][name] && !countryIsSelected){
				colorCountry(data[dataType][name], this, year, dataType)	
			}
		});
	}
	
	function lerpColor(a, b, amount) { 
		var ah = parseInt(a.replace(/#/g, ''), 16),
			ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
			bh = parseInt(b.replace(/#/g, ''), 16),
			br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
			rr = ar + amount * (br - ar),
			rg = ag + amount * (bg - ag),
			rb = ab + amount * (bb - ab);

		return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
	}
	
	function colorCountry(country, obj, year, datatype) {
		if(!year){
			year = "2001";
		}
		if(country[year]){
			if(datatype == "avgTempCountryReformed") {
				var min = -18;
				var max = 49;
				var percentage = ((country[year] + 18) * 100)/max;
				d3.select(obj).style("fill", "hsl("+ (300 - (percentage * 3)) + ", 100%, 50%)");
			} else {
				var max = 2410855500;
				// 56262188.99488994
				var average = 56262188;
				
				if(country[year] > average) {
					var percentage = (((country[year]) * 100)/max) + 30;
					d3.select(obj).style("fill", lerpColor("#ffffbf", "#2c7bb6", percentage / 100));
				} else {
					var percentage = (((country[year]) * 100)/average - 30);
					d3.select(obj).style("fill", lerpColor("#fc8d59", "#ffffbf", percentage / 100));
				}
			}
		} else {
			
		}
	}
	
	function drawData(selectedCountries) {
			
	d3.select("#Chart").on("change", function() {
		if(chart){
			chart.destroy();
		}
		
		if(this.value == "Bar"){
			chart = createChart1();
			drawData(selectedCountries);
		}
		else if(this.value == "Stacked1"){
			chart = createChart2();
			drawData(selectedCountries);
		}
		
		else if(this.value == "Stacked2"){
			chart = createChart3();
			drawData(selectedCountries);
		}
		else if(this.value == "Radar"){
			chart = createChart5();
			drawData(selectedCountries);
		}
		else{
			chart = createChart();
			drawData(selectedCountries);
		}
	});
		
		if(!chart) {
			chart = createChart()
		}
		if(selectedCountries.length > 0) {
			d3.select("#graph").transition().duration(1000).style("right", "0px");
			d3.selectAll("select").transition().duration(1000).style("left", "450px");
			d3.select("#legenda").transition().duration(1000).style("left", "450px");
			d3.select("#Chart").transition().duration(1000).style("left", "100px");
			svg.transition().duration(1000).style("left", "450px");
			clearTable();
			datatype = getDataObjectName(document.getElementById('datalist').selectedOptions[0].text);
			fillChart(selectedCountries, data[datatype], chart);
			for(var i = 0; i < selectedCountries.length; i++) {
				if(data[datatype][selectedCountries[i]]) {
					fillTableWithData(data[datatype][selectedCountries[i]], selectedCountries[i], document.getElementById('yearlist').selectedOptions[0].text, datatype);
				}
			}
		} else{
			d3.select("#graph").transition().duration(1000).style("right", "-51%");
			d3.selectAll("select").transition().duration(1000).style("left", window.innerWidth / 2 + "px");
			d3.select("#legenda").transition().duration(1000).style("left", window.innerWidth / 2 + "px");
			svg.transition().duration(1000).style("left", window.innerWidth / 2 + "px");
		}
	}
	
	function getDataObjectName(name) {
		if(name == "Average Temperature Data") {
			return "avgTempCountryReformed";
		} else if(name == "Export Data") {
			return "exportDataReformed";
		} else {
			return "importDataReformed";
		}
	}
	
	function clearCountries(){
		svg.selectAll('path.land').each(function(d,i) { 
			var name = countryById[d.id];
			var countryIsSelected = false;
			for(var i = 0; i < selectedCountries.length; i++) {
				if(selectedCountries[i] == name) {
					countryIsSelected = true;
					break;
				}
			}
			if(!countryIsSelected) {
				d3.select(this).style("fill", "#696969")
			}
		});
	}

	function changeLegenda() {
		datatype = document.getElementById('datalist').selectedOptions[0].text;
		if(datatype == "Average Temperature Data"){
			var el = document.getElementById('bar');
			el.src = "../Visualisation-assignment2/img/avgtemp.jpg"
			var min = document.getElementById('begin');
			var max = document.getElementById('end');
			min.innerHTML = "-18";
			max.innerHTML = "48";
		} else {
			var el = document.getElementById('bar');
			el.src = "../Visualisation-assignment2/img/exportimport.jpg"
			var min = document.getElementById('begin');
			var max = document.getElementById('end');
			min.innerHTML = "0";
			max.innerHTML = "2.410.855.500";
		}
	}

    //Country focus on option select
    d3.selectAll("select").on("change", function() {

		if(this.name == "countries") {
			  var rotate = projection.rotate(),
			  focusedCountry = country(countries, this),
			  p = d3.geo.centroid(focusedCountry);
			
			  svg.selectAll(".focused").classed("focused", focused = false);

			//Globe rotating

			(function transition() {
			  d3.transition()
			  .duration(2500)
			  .tween("rotate", function() {
				var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
				return function(t) {
				  projection.rotate(r(t));
				  svg.selectAll("path").attr("d", path)
				  .classed("focused", function(d, i) { return d.id == focusedCountry.id ? focused = d : false; });
				};
			  })
			  })();
		} else {
			clearCountries();
			changeLegenda();
			var datatype = getDataObjectName(document.getElementById('datalist').selectedOptions[0].text);
			var table = $('#DataTable').DataTable();
			$(table.column(2).header()).text(document.getElementById('datalist').selectedOptions[0].text);
			if(datatype == "avgTempCountryReformed"){
				$(table.column(3).header()).text("");
			} else {
				$(table.column(3).header()).text("Percentage");
			}
			colorCountries(document.getElementById('yearlist').selectedOptions[0].text, datatype)
			fillChart(selectedCountries, data[datatype], chart);
			clearTable();
			for(var i = 0; i < selectedCountries.length; i++) {
				if(data[datatype][selectedCountries[i]]) {
					fillTableWithData(data[datatype][selectedCountries[i]], selectedCountries[i], document.getElementById('yearlist').selectedOptions[0].text, datatype);
				}
			}
		}
    });

    function country(cnt, sel) { 
      for(var i = 0, l = cnt.length; i < l; i++) {
        if(cnt[i].id == sel.value) {return cnt[i];}
      }
    };
	
  };
  
  tempfunction()
  
  function tempfunction() {
	  var data = new Data();
	  var amount = 0;
	  var max = 0;
	  var average = 0;
	  var total = 0;
	  for(var i in data.exportDataReformed) {
		if(i != "World") {
		for(var j in data.exportDataReformed[i]){
			amount++;
			total += data.exportDataReformed[i][j];
			if(data.exportDataReformed[i][j] > max){
				max = data.exportDataReformed[i][j];
			}
		}
		}
      }	
	  for(var i in data.importDataReformed) {
		  if(i != "World") {
		for(var j in data.importDataReformed[i]){
			amount++;
			total += data.importDataReformed[i][j];
			if(data.importDataReformed[i][j] > max){
				max = data.importDataReformed[i][j];
			}
		}
		  }
      }
  }
}

function fillTable(){
  document.getElementById("info_bottom").appendChild(buildTable());
}

function clearTable() {
	 var table = $('#DataTable').DataTable();
	 table.clear();
	 table.draw();
}

function fillTableWithData(data, country, year, datatype) {
	var table = $('#DataTable').DataTable();
	var e = document.getElementById("year");
	if(data[year]) {
		if(data[year] % 1 == 0) {
			var d = new Data();
			world = d[datatype]["World"][year];
			console.log(world);
			table.row.add([country, year, data[year].formatMoney(2), (parseInt(data[year]) * 100 / parseInt(world)).toFixed(4) + "%"]);
		} else {
			table.row.add([country, year, data[year].formatMoney(2), ""]);
		}
		
	}
	table.draw(); 
}

function buildTable() {
    var table = document.getElementById("DataTable");
    table.className="gridtable";
    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");
    var headRow = document.createElement("tr");
    ["Country","Year","Average Temperature Data", ""].forEach(function(el) {
      var th=document.createElement("th");
      th.appendChild(document.createTextNode(el));
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead); 
	table.appendChild(tbody);  
    return table;
}

Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

this.createTable = function() {
	
	$(document).ready(function(){
	$('#DataTable').DataTable({ 
	paging: false,
	bLengthChange: false,
	    "footerCallback": function ( row, data, start, end, display ) {
            var api = this.api(), data;
 
            // Remove the formatting to get integer data for summation
            var intVal = function ( i ) {
                return typeof i === 'string' ?
                    i.replace(/[\$,]/g, '')*1 :
                    typeof i === 'number' ?
                        i : 0;
            };
 
            // Total over all pages
            total = api
                .column( 2 )
                .data()
                .reduce( function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0 );
 
            // Total over this page
            pageTotal = api
                .column( 2, { page: 'current'} )
                .data()
                .reduce( function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0 );
 
            // Update footer
            $( api.column( 2 ).footer() ).html(
                ' ('+ (total).formatMoney(2) +' total)'
			);}
		});
	})
}

function createChart(){
	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
	type: 'line',
	data: {
		labels: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010","2011","2012"],
		datasets: []
	},
	options: {
		legend: {
			position: 'right',
		},
		scales: {
			yAxes: [{
				Stacked: false,
				ticks: {
					beginAtZero:true
				}
			}]
		}
	}
	});
	return myChart;
}

function createChart1(){
	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
	type: 'bar',
	data: {
		labels: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010","2011","2012"],
		datasets: []
	},
	options: {
		legend: {
			position: 'right',
		},
		scales: {
			yAxes: [{
				ticks: {
					beginAtZero:true
				}
			}]
		}
	}
	});
	return myChart;
}

function createChart2(){
	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
	type: 'line',
	data: {
		labels: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010","2011","2012"],
		datasets: []
	},
	options: {
		legend: {
			position: 'right',
		},
		scales: {
			yAxes: [{
				stacked: true
			}]
		}
	}
	});
	return myChart;
}
function createChart3(){
	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
	type: 'bar',
	data: {
		labels: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010","2011","2012"],
		datasets: []
	},
	options: {
		legend: {
			position: 'right',
		},
		scales: {
			yAxes: [{
				stacked: true
			}]
		}
	}
	});
	return myChart;
}

function createChart5(){
	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
	type: 'radar',
	data: {
		labels: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010","2011","2012"],
		datasets: []
	},
	options: {
		legend: {
			position: 'right',
		},
	}
	});
	return myChart;
}

function fillChart(selectedcountries, data, myChart){
//document.getElementById("myChart").remove();
var colors = ['rgba(166,206,227,1)','rgba(31,120,180,1)','rgba(178,223,138,1)','rgba(51,160,44,1)','rgba(251,154,153,1)','rgba(227,26,28,1)','rgba(253,191,111,1)','rgba(255,127,0,1)','rgba(202,178,214,1)','rgba(106,61,154,1)'];
var datasets = [];
var enddata = [];



for (j=0; j < selectedcountries.length; j++){
	 var temp = data[selectedcountries[j]];
		for(var l in temp){
			if (l > 2000 && l < 2013){
				if (!(enddata[j])) {
					enddata[j]=[];
				}
				enddata[j].push(temp[l]); 
			}
		}
	}


console.log(d3.select("#Chart").node().value);
	
if(d3.select("#Chart").node().value == "Stacked1" || d3.select("#Chart").node().value == "Stacked2"){
	for (i=0; i < selectedcountries.length; i++){
		data = {
			label: selectedcountries[i],
			data: enddata[i],
			backgroundColor: colors[i],
			borderColor: colors[i], 
			fill: 'origin'
		}
		datasets[i] = data;
	}
}
else {
	for (i=0; i < selectedcountries.length; i++){
		data = {
			label: selectedcountries[i],
			data: enddata[i],
			backgroundColor: colors[i],
			borderColor: colors[i], 
			fill: false
		}
		datasets[i] = data;
	}
}
myChart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
	
 myChart.data.datasets = datasets;
	  myChart.update();

}
