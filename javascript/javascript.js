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


queue()
    .await(ready);

 function ready(error, world, countryData) {
	
	var data = new Data();
	world = data.world;
	countryData = data.countryData;
	var selectedCountries = [];
	
    var countryById = {},
    countries = topojson.feature(world, world.objects.countries).features;

    //Adding countries to select

    countryData.forEach(function(d) {
      countryById[d.id] = d.name;
      option = countryList.append("option");
      option.text(d.name);
      option.property("value", d.id);
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
			d3.select(this).style("fill", "#A98B6F")
			d3.select(this).blur();
		} else {
			selectedCountries.push(name);
			d3.select(this).style("fill", "#FF0000")
		}
		drawData(selectedCountries);
	});
	
	function drawData(selectedCountries) {
		if(selectedCountries.length > 0) {
			d3.select("#graph").transition().duration(1000).style("right", "0px");
			d3.select("select").transition().duration(1000).style("left", "450px");
			svg.transition().duration(1000).style("left", "450px");
			clearTable();
			for(var i = 0; i < selectedCountries.length; i++) {
				if(data.avgTempCountry[selectedCountries[i]]) {
					fillTableWithData(data.avgTempCountry[selectedCountries[i]], selectedCountries[i]);
				}
			}
		} else{
			d3.select("#graph").transition().duration(1000).style("right", "-51%");
			d3.select("select").transition().duration(1000).style("left", window.innerWidth / 2 + "px");
			svg.transition().duration(1000).style("left", window.innerWidth / 2 + "px");
		}
	}

    //Country focus on option select

    d3.select("select").on("change", function() {
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

function fillTableWithData(data, country) {
	 var table = $('#DataTable').DataTable();
	 data.forEach(function(el) {
      
	  if(el.year == 2012) {
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
