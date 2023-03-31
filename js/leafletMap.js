class LeafletMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
    }
    console.log(_data);
    this.colorType = "default";
    this.radiusSize = 4;
    this.data = _data;
    this.initLegend();
    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // vis.colorsOption = new colorsOption({parentElement: '#map-colors'}, vis.formatColors(vis.data, "service_code"));

    //ESRI
    vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    //TOPO
    vis.topoUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    vis.topoAttr = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'

    //Thunderforest Outdoors- requires key... so meh... 
    vis.thOutUrl = 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}';
    vis.thOutAttr = '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    //Stamen Terrain
    vis.stUrl = 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}';
    vis.stAttr = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    vis.urlList = [vis.stUrl, vis.topoUrl, vis.esriUrl];
    vis.mapType = 0;

    //this is the base map layer, where we are showing the map background
    vis.base_layer = L.tileLayer(vis.urlList[vis.mapType], {
      id: 'esri-image',
      attribution: vis.esriAttr,
      ext: 'png'
    });

    vis.theMap = L.map('my-map', {
      selectArea: true,
      center: [39.15, -84.5],
      zoom: 11.5,
      layers: [vis.base_layer]
    });
  
    //if you stopped here, you would just have a map

    //Brushing
    vis.theMap.selectArea.enable();    

    //initialize svg for d3 to add to map
    L.svg({ clickable: true }).addTo(vis.theMap)// we have to make the svg layer clickable
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto");


    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoomend", function(){
      vis.Dots
        .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
        .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y)
    });

    vis.theMap.on('areaselected', (e) => {
      let areaSelect = e.bounds;
      handle_filter({
        "d0Lon": areaSelect._northEast.lng,
        "d0Lat": areaSelect._southWest.lat,
        "d1Lon": areaSelect._southWest.lng,
        "d1Lat": areaSelect._northEast.lat
      }, "areaSelect");
    });


    vis.updateLegend();
    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    vis.Dots = vis.svg.selectAll('circle')
      .data(vis.data)
      .join('circle')
        .attr("fill", function(d){return vis.colors(d[vis.colorType])})
        .attr("stroke", "black")
        //Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
        //leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
        //Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
        .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).x)
        .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude, d.longitude]).y)
        .attr("r", 4)
        .on('mouseover', function (event, d) { //function to add mouseover event
          d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
            .duration('150') //how long we are transitioning between the two states (works like keyframes)
            .attr("fill", "red") //change the fill
            .attr('r', vis.radiusSize); //change radius

          //create a tool tip
          d3.select('#tooltip')
            .style('opacity', 1)
            .style('z-index', 1000000)
            // Format number with million and thousand separator
            .html(`<div class="tooltip-label">Requested Date ${d.requested_date}, Updated Date: ${(d.updated_date)}
                                        Agency Responsible: ${(d.agency_responsible)} Description: ${(d.description)}</div>`);

        })
        .on('mousemove', (event) => {
          //position the tooltip
          d3.select('#tooltip')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseleave', function () { //function to add mouseover event
          d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
            .duration('150') //how long we are transitioning between the two states (works like keyframes)
            .attr("fill", function(d){return vis.colors(d[vis.colorType])}) //change the fill
            .attr('r', 5) //change radius

          d3.select('#tooltip').style('opacity', 0);//turn off the tooltip

        })
        .on('click', (event, d) => { //experimental feature I was trying- click on point and then fly to it
          // vis.newZoom = vis.theMap.getZoom()+2;
          // if( vis.newZoom > 18)
          //  vis.newZoom = 18; 
          // vis.theMap.flyTo([d.latitude, d.longitude], vis.newZoom);
        });
  }


  toggleHeatmap() {
    let vis = this;

    if (vis.isHeatMapOn == false) {
      vis.isHeatMapOn = true
      vis.Grid = vis.svg.append('g').attr('id', 'grid');

      for (let i = 0; i < document.body.clientWidth; i += 20) {
        for (let j = 0; j < document.body.clientHeight; j += 20) {
          vis.Grid.append('rect')
            .attr('width', '20')
            .attr('height', '20')
            .attr("stroke", "black")
            .attr("fill", "red")
            .attr('opacity', '0')
            .attr('transform', 'translate(' + String(i) + ',' + String(j) + ')')
            .attr('id', String(i) + '-' + String(j));
        }
      }
      let transformIndex = document.getElementById('my-map').innerHTML.indexOf("translate3d");
        let transformString = document.getElementById('my-map').innerHTML.substring(transformIndex);

        transformIndex = transformString.indexOf(";");
        transformString = transformString.substring(0, transformIndex).replace('3d', '').replace(', 0px)', ')').replaceAll('px', '');

        let firstNum = transformString.substring(10, transformString.indexOf(','));
        if (parseInt(firstNum) > 0) {
          firstNum = "-" + firstNum
        }
        else {
          firstNum = firstNum.substring(1);
        }

        let secondNum = transformString.substring(transformString.indexOf(',') + 2, transformString.indexOf(')'));
        if (parseInt(secondNum) > 0) {
          secondNum = "-" + secondNum
        }
        else {
          secondNum = secondNum.substring(1);
        }
        vis.Grid.attr('transform', 'translate(' + firstNum + ',' + secondNum + ')')
        vis.updateHeatmap();
      // vis.Grid.attr('opacity', '0')
      vis.theMap.on('moveend', (event) => {
        let transformIndex = document.getElementById('my-map').innerHTML.indexOf("translate3d");
        let transformString = document.getElementById('my-map').innerHTML.substring(transformIndex);

        transformIndex = transformString.indexOf(";");
        transformString = transformString.substring(0, transformIndex).replace('3d', '').replace(', 0px)', ')').replaceAll('px', '');

        let firstNum = transformString.substring(10, transformString.indexOf(','));
        if (parseInt(firstNum) > 0) {
          firstNum = "-" + firstNum
        }
        else {
          firstNum = firstNum.substring(1);
        }

        let secondNum = transformString.substring(transformString.indexOf(',') + 2, transformString.indexOf(')'));
        if (parseInt(secondNum) > 0) {
          secondNum = "-" + secondNum
        }
        else {
          secondNum = secondNum.substring(1);
        }
        vis.Grid.attr('transform', 'translate(' + firstNum + ',' + secondNum + ')')
        vis.updateHeatmap();
      });
      this.updateHeatmap();
      return;
    }
    else {
      vis.isHeatMapOn = false;
      document.getElementById('grid').remove();
      return;
    }
  }

  updateHeatmap() {
    let vis = this;
    let coordinateDict = {};
    document.getElementById('grid').childNodes.forEach(function (item) {
      item.setAttribute('opacity', 0);
    });
    vis.Dots._groups[0].forEach(function (item) {
      // tooltips can be grabbed here
      let x = Math.floor(item.getBoundingClientRect().left/ 20) * 20;
      let y = Math.floor(item.getBoundingClientRect().top/ 20) * 20;
      if (coordinateDict[String(x) + "-" + String(y)] !== undefined) {
        coordinateDict[String(x) + "-" + String(y)] = coordinateDict[String(x) + "-" + String(y)] + 1;
      }
      else {
        coordinateDict[String(x) + "-" + String(y)] = 1;
      }
    });
    let maxKey, maxValue = 0;

    for (const [key, value] of Object.entries(coordinateDict)) {
      if (value > maxValue) {
        maxValue = value;
        maxKey = key;
      }
    }

    let scale = 1 / maxValue;
    for (const [key, value] of Object.entries(coordinateDict)) {
      let square = document.getElementById(key);
      if(square) {
        square.setAttribute('opacity', value * scale);
      }
    }
  }

  renderVis() {
    let vis = this;

    //not using right now... 

  }

  updateLayer() {
    let vis = this;
    vis.mapType = vis.mapType % 3;
    vis.theMap.removeLayer(vis.base_layer);
    vis.base_layer = L.tileLayer(vis.urlList[vis.mapType], {
      id: 'esri-image',
      attribution: vis.esriAttr,
      ext: 'png'
    });
    vis.base_layer.addTo(vis.theMap);
  }

  formatColorsData(data, field) {
    let data_rollup = d3.rollup(data, v => v.length, d => d[field])
    let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({ "x": k, "y": v })));
    let retData = [];
    if (field == "service_code") {
      myObjStruct.sort((a, b) => b.y - a.y);
      retData = myObjStruct.slice(0, 9);
      let remainingData = myObjStruct.slice(9, myObjStruct.length).reduce((partialSum, a) => partialSum + a.y, 0)
      if(remainingData > 0){ retData.push({ x: "other", y: remainingData })}
    }
    else {
      retData = myObjStruct;
    }
    return retData
  }

  initLegend() {
    let vis = this;

    vis.legend_svg = d3.select("#map-colors")
      .attr('width', 100)
      .attr('height', 2000);

    vis.legend_chart = vis.legend_svg.append('g');

    vis.updateLegend();
  }

  updateLegend() {
    let vis = this;

    // .join doesn't dynamically update data (idk why), so on update event listner remove and then add the group each update.
    vis.legend_chart.remove();
    vis.legend_chart = vis.legend_svg.append('g')
      .attr("transform", function (d, i) { return "translate(" + i * 20 + ",0)"; });

    vis.legend_data = vis.formatColorsData(vis.data, vis.colorType);
    vis.legend_colordata = vis.legend_data.map(a => a.x);
    vis.legend_colordata.sort((a, b) => a - b);
    vis._setDataColor();

    vis.legend_chart.selectAll(".firstrow")
      .data(vis.legend_colordata)
      .join("circle")
      .attr("cy", function (d, i) { return 30 + i * 50 })
      .attr("cx", 50)
      .attr("r", 10)
      .attr("fill", function (d) { return vis.colors(d) })
    vis.legend_chart.selectAll("labels")
      .data(vis.legend_colordata)
      .join("text")
      .attr("y", function (d, i) { return 36.5 + i * 50 })
      .style("fill", function (d) { return vis.colors(d) })
      .attr("x", 68)
      .style("font-size", "18px")
      .text(function (d) { return d })
  }

  _setDataColor(data) {
    let vis = this;
    if (vis.colorType == "none") {
      vis.colors = function () { return "steelblue" };
    }
    if (vis.colorType == "default") {
      vis.colors = function () { return "steelblue" };
    }
    else if (vis.colorType == "service_code" || vis.colorType == "agency_responsible") {
      vis.colors = d3.scaleOrdinal().domain(vis.legend_colordata)
        .range(d3.schemeSet2)
    }
    else if (vis.colorType == "updateTime") {
      vis.colors = d3.scaleLinear().domain([0, 30])
        .range(["white", "#E00122"]);
    }
    else if (vis.colorType == "request_into_year") {
      vis.colors = d3.scaleLinear().domain([10, 11])
        .range(["white", "#E00122"]);
    }
  }
}



