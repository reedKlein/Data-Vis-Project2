const parseTime = d3.timeParse("%Y-%m-%d");
var selected_filters = [];
var charts = [];
var master_data = [];

d3.dsv("|", '/data/cincy311_cleaned_partial.tsv')
.then(data => {
    console.log(data[0]);
    console.log(data.length);
    data.forEach(d => {
      d.longitude = +d.longitude; //make sure these are not strings
      d.latitude = +d.latitude; //make sure these are not strings
      d.requested_datetime = new Date(d.requested_datetime).toDateString();
      d.requested_day = get_requested_day(new Date(d.requested_date).getDay());
      d.service_code = d.service_code.replace(/["]+/g, "");
      d.service_name = d.service_name.replace(/["]+/g, "");
      d.updated_date = new Date(d.updated_date);
      d.requested_date = new Date(d.requested_date)
      d.updateTime = Math.ceil(Math.abs(d.updated_date - d.requested_date)/(1000 * 60 * 60 * 24)); // Time in days between request and update
      d.request_into_year = d.requested_date.getMonth();
      d.zipcode = d.zipcode.split(".")[0];
    });

    master_data = data;

    // Initialize chart and then show it
    //colorsOption = new colorsOption({parentElement: '#map-colors'}, format_map_option_data(format_barchart(data, "service_code"), "service_code"));
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);

    requested_datetime_linechart = new FocusContextVis({parentElement: '#requested_datetime_linechart'}, 
                                                        format_barchart_data(data, "requested_datetime"), 
                                                        "requested_datetime",
                                                        "Date",
                                                        "Requests",
                                                        "Request Dates");
    
    charts.push(requested_datetime_linechart)

    requested_day_barchart = new Barchart({parentElement: '#requested_day_barchart'},
                                                        format_barchart_data(data, "requested_day"),
                                                        "requested_day",
                                                        "Day",
                                                        "Requests",
                                                        "Day Requested");
    charts.push(requested_day_barchart)

    service_name_barchart = new Barchart({parentElement: '#service_name_barchart',
                                                        margin: {top: 10, right: 10, bottom: 50, left: 50}},
                                                        format_barchart_data(data, "service_name"),
                                                        "service_name",
                                                        "Service",
                                                        "Requests",
                                                        "Service Requests");
    charts.push(service_name_barchart)

    zipcode_barchart = new Barchart({parentElement: '#zipcode_barchart',
                                                        margin: {top: 10, right: 5, bottom: 50, left: 50}},
                                                        format_barchart_data(data, "zipcode"),
                                                        "zipcode",
                                                        "Zipcode (452 abbreviated with ')",
                                                        "Requests",
                                                        "Requests by Zipcode");
    charts.push(zipcode_barchart)

    update_time_histogram = new Histogram({ parentElement: '#update_time_chart'}, 
                                    data, 
                                    "updateTime",
                                    "Day Bins",
                                    "Requests",
                                    "Days between request and update");
    charts.push(update_time_histogram)

    charts.forEach( chart => {
      chart.updateVis();
    });

  })
  .catch(error => console.error(error));


// Create an object from rolled up data and assign it to templated "x" and "y" fields
function format_barchart_data(data, field){
  data_rollup = d3.rollup(data, v => v.length, d => d[field])
  let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({"x": k, "y" : v})));
  let retData = [];
  if (field === "service_name") {
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

function get_requested_day(day){
  switch(day){
    case 0:
      return "Sun."
    case 1:
      return "Mon."
    case 2:
      return "Tues."
    case 3:
      return "Wed."
    case 4:
      return "Thur."
    case 5:
      return "Fri."
    case 6:
      return "Sat."
  }
  return "undef."
}


// Event Listeners 

d3.select('#map-background').on('click', d=> {
  leafletMap.mapType += 1;
  leafletMap.updateLayer();
});

d3.select('#colors').on('change', d => {
  selection = document.getElementById('colors');
  color_sel = selection.options[selection.selectedIndex].value;
  leafletMap.colorType = color_sel;
  leafletMap.updateLegend();
  leafletMap.updateVis();
});

d3.select('#clear-filters').on('click', () =>{
  document.getElementById('clear-line').hidden = true;
  clearSelect();
})

d3.select('#filter-line').on('click', d=> {
  requested_datetime_linechart.filterLine();
  document.getElementById('clear-line').hidden = false;
});

d3.select('#clear-line').on('click', () => {
  let index = 0;
  selected_filters.forEach( filter =>{
    if(filter.field == "requested_datetime"){
      selected_filters.splice(index,1);
    }
    index++;
  });
  let filtered_data = filtering("requested_datetime");
  update_charts(filtered_data);
  document.getElementById('clear-line').hidden = true;
})

d3.select('#clear-map').on('click', () => {
  let index = 0;
  selected_filters.forEach( filter =>{
    if(filter.field == "areaSelect"){
      selected_filters.splice(index,1);
    }
    index++;
  });
  let filtered_data = filtering("areaSelect");
  update_charts(filtered_data);
  document.getElementById('clear-line').hidden = true;
})

d3.select('#nBins').on('input', function(){
  update_time_histogram.nBins = +this.value;
  update_time_histogram.updateVis();
});

d3.select('#minBin').on('input', function(){
  maxBin = document.getElementById('maxBin').value;
  if(this.value < 0){this.value = 0}
  handle_filter({"d0": Math.min(this.value, maxBin), "d1": Math.max(this.value, maxBin)}, "updateTime")
});

d3.select('#maxBin').on('input', function(){
  minBin = document.getElementById('minBin').value;
  if(this.value < 0){this.value = 0}
  handle_filter({"d0": Math.min(this.value, minBin), "d1": Math.max(this.value, minBin)}, "updateTime")
});


// Clear selection button functionality
function clearSelect(){
  selected_filters = [];
  update_charts(master_data);
}

// update table and charts with filtered data
function update_charts(filtered_data){
  charts.forEach(chart => {
      if(chart.type === "requested_datetime"){
          chart.data = format_barchart_data(filtered_data, chart.type);
          chart.updateVis();
      }
      else if(chart.type === "updateTime"){
        chart.data = filtered_data
        chart.updateVis();
      }
      else{
        chart.data = format_barchart_data(filtered_data, chart.type)
        chart.updateVis();
      }
  });
  leafletMap.data = filtered_data;
  leafletMap.updateLegend();
  leafletMap.updateVis();
}

function filtering(field){
  filtered_data = master_data;
  selected_filters.forEach( filter => {
      if(filter.field === "requested_day" || filter.field === "service_name" || filter.field === "zipcode"){
          filtered_data = filtered_data.filter(x => {return x[filter.field] == filter.d['x']});
      }
      else if(filter.field == 'updateTime'){
        filtered_data = filtered_data.filter(x => {return x[filter.field] >= filter.d['d0'] && x[filter.field] <= filter.d['d1']});
      }
      else if(filter.field == 'requested_datetime'){
        filtered_data = filtered_data.filter(x => {return new Date(x[filter.field]) >= filter.d['d0'] && new Date(x[filter.field]) < filter.d['d1']});
      }
      else if(filter.field === "areaSelect"){
        filtered_data = filtered_data.filter(x => {return x['longitude'] < filter.d['d0Lon'] && x['longitude'] > filter.d['d1Lon'] && x['latitude'] > filter.d['d0Lat'] && x['latitude'] < filter.d['d1Lat']})
      }
  });
  return filtered_data;
}

// handle filter event
function handle_filter(data, field){
  update_filter_selection(data, field);
  filtered_data = filtering(field);
  update_charts(filtered_data)
  console.log("data ", data, "\n", "field ", field, "\n", "filters ", selected_filters);
}

// update selection for multi select
function update_filter_selection(d, field){ 
  console.log(selected_filters);
  if(selected_filters.length == 0){ // Check if filter exists
      selected_filters.push({"field": field, "d": d});
  }
  else{ // remove filter
      let index = 0
      let newFilter = true;
      selected_filters.forEach( filter =>{
        if(filter.field == "requested_datetime" || filter.field == "updateTime" || filter.field == "areaSelect"){
          selected_filters.splice(index,1);
        }
        if(filter.field == field && (filter.d['x'] === d['x'] && d['x'] !== undefined)){
            selected_filters.splice(index, 1);
            newFilter = false;       
        }
        index++;
      });
      if(newFilter){
          selected_filters.push({"field": field, "d": d});
      }
  }
}



/* 
TODO:

-BUTTON LAYOUT / STYLE
-MAP BRUSHING FROM KHOA?

*/
