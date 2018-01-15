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
  countryList = d3.select("body").append("select").attr("name", "countries");
  
  var yearList = d3.select("body").append("select").attr("name", "years").attr("id", "yearlist");


queue()
    .await(ready);

 function ready(error, world, countryData) {
	
	var data = new Data();
	world = data.world;
	countryData = data.countryData;
	var selectedCountries = [];
	var yearsData = ["2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012"];
	// var min = 0;
	// var max = 0;
	// for(var k in data.avgTempCountry){
		// for(var i = 0; i < data.avgTempCountry[k].length; i++) {
			// if(data.avgTempCountry[k][i].AvgTemp < min) {
				// min = data.avgTempCountry[k][i].AvgTemp;
			// }
			// if(data.avgTempCountry[k][i].AvgTemp > max) {
				// max = data.avgTempCountry[k][i].AvgTemp;
			// }
		// }
	// }
	// console.log(min);
	// console.log(max);
	
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
      countryTooltip.text(countryById[d.id])
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
			selectedCountries.splice(index, 1);
			colorCountry(data.avgTempCountry[name], this);
			//d3.select(this).style("fill", "#FFFFFF")
		} else {
			selectedCountries.push(name);
			d3.select(this).style("fill", "#33CC33")
		}
		drawData(selectedCountries);
	});
	
	colorCountries()
	
	function colorCountries(year){
		svg.selectAll('path.land').each(function(d,i) { 
			var name = countryById[d.id];
			data.avgTempCountry[name]; 
			var countryIsSelected = false;
			for(var i = 0; i < selectedCountries.length; i++) {
				if(selectedCountries[i] == name) {
					countryIsSelected = true;
					break;
				}
			}
			if(data.avgTempCountry[name] && !countryIsSelected){
				colorCountry(data.avgTempCountry[name], this, year)	
			}
		});
	}
	
	function colorCountry(country, test, year) {		
		Color = function(hexOrObject) {
			var obj;
			if (hexOrObject instanceof Object) {
				obj = hexOrObject;
			} else {
				obj = LinearColorInterpolator.convertHexToRgb(hexOrObject);
			}
			this.r = obj.r;
			this.g = obj.g;
			this.b = obj.b;
		}
		Color.prototype.asRgbCss = function() {
			return "rgb("+this.r+", "+this.g+", "+this.b+")";
		}

		var LinearColorInterpolator = {
			// convert 6-digit hex to rgb components;
			// accepts with or without hash ("335577" or "#335577")
			convertHexToRgb: function(hex) {
				match = hex.replace(/#/,'').match(/.{1,2}/g);
				return new Color({
					r: parseInt(match[0], 16),
					g: parseInt(match[1], 16),
					b: parseInt(match[2], 16)
				});
			},
			// left and right are colors that you're aiming to find
			// a color between. Percentage (0-100) indicates the ratio
			// of right to left. Higher percentage means more right,
			// lower means more left.
			findColorBetween: function(left, right, percentage) {
				newColor = {};
				components = ["r", "g", "b"];
				for (var i = 0; i < components.length; i++) {
					c = components[i];
					newColor[c] = Math.round(left[c] + (right[c] - left[c]) * percentage / 100);
				}
				return new Color(newColor);
			}
		}
		
		for(var i = 0; i < country.length; i++){
			if((!year && country[i].year == "2012") || (year && country[i].year == year)) {
				var min = -18;
				var max = 49;
				var r = new Color("#d62234");
				var l = new Color("#ffffff");
				percentage = ((country[i].AvgTemp + 18) * 100)/max;
				//var color = LinearColorInterpolator.findColorBetween(l, r, percentage).asRgbCss();
				d3.select(test).style("fill", "hsl("+ (300 - (percentage * 3)) + ", 100%, 50%)");
				break;
			}
		}
	}
	
	function drawData(selectedCountries) {
			
	d3.select("#Chart").on("change", function() {
		console.log(chart);
		if(chart){
			chart.destroy();
		}
		
		if(this.value == "Bar"){
			chart = createChart1();
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
			d3.select("#Chart").transition().duration(1000).style("left", "15%");
			svg.transition().duration(1000).style("left", "450px");
			clearTable();
			fillChart(selectedCountries, data.avgTempCountry, chart);
			for(var i = 0; i < selectedCountries.length; i++) {
				if(data.avgTempCountry[selectedCountries[i]]) {
					fillTableWithData(data.avgTempCountry[selectedCountries[i]], selectedCountries[i], document.getElementById('yearlist').selectedOptions[0].text);
				}
			}
		} else{
			d3.select("#graph").transition().duration(1000).style("right", "-51%");
			d3.selectAll("select").transition().duration(1000).style("left", window.innerWidth / 2 + "px");
			svg.transition().duration(1000).style("left", window.innerWidth / 2 + "px");
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
			colorCountries(this.value)
			clearTable();
			for(var i = 0; i < selectedCountries.length; i++) {
				if(data.avgTempCountry[selectedCountries[i]]) {
					fillTableWithData(data.avgTempCountry[selectedCountries[i]], selectedCountries[i], this.value);
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
}

function fillTable(data){
  document.getElementById("info_bottom").appendChild(buildTable());
}

function clearTable() {
	 var table = $('#DataTable').DataTable();
	 table.clear();
	 table.draw();
}

function fillTableWithData(data, country, year) {
	var table = $('#DataTable').DataTable();
	data.forEach(function(el) {
		var e = document.getElementById("year");
		if(el.year == year) {
			table.row.add([country, el.year, el.AvgTemp]);
			//$("#DataTable > tbody").append(tr);  
		}
		table.draw();
    });
   
}

function buildTable() {
    var table = document.getElementById("DataTable");
    table.className="gridtable";
    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");
    var headRow = document.createElement("tr");
    ["Country","Year","Average Temperature"].forEach(function(el) {
      var th=document.createElement("th");
      th.appendChild(document.createTextNode(el));
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead); 
	table.appendChild(tbody);  
    return table;
}


this.createTable = function() {
	$(document).ready(function(){
	$('#DataTable').DataTable({ paging: false, bLengthChange: false});
	});
}

function createChart(){
	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
	type: 'line',
	data: {
		labels: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010"],
		datasets: []
	},
	options: {
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

function createChart1(){
	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
	type: 'bar',
	data: {
		labels: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010"],
		datasets: []
	},
	options: {
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

function fillChart(selectedcountries, data, myChart){
//document.getElementById("myChart").remove();
var colors = ['rgba(166,206,227,1)','rgba(31,120,180,1)','rgba(178,223,138,1)','rgba(51,160,44,1)','rgba(251,154,153,1)','rgba(227,26,28,1)','rgba(253,191,111,1)','rgba(255,127,0,1)','rgba(202,178,214,1)','rgba(106,61,154,1)'];
var datasets = [];
var enddata = [];

for (j=0; j < selectedcountries.length; j++){
	 var temp = data[selectedcountries[j]];
		for (k=0; k < temp.length; k++){
			if (temp[k].year > 2000 && temp[k].year < 2011){
				if (!(enddata[j])) {
					enddata[j]=[];
				}
				enddata[j].push(temp[k].AvgTemp); 
		}
	}
}

for (i=0; i < selectedcountries.length; i++){
	data = {
		label: selectedcountries[i],
		data: enddata[i],
		backgroundColor: colors[i],
		borderColor: colors[i],
		fill:false
	}
	datasets[i] = data;
}
myChart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
	
 myChart.data.datasets = datasets;
	  myChart.update();

}
