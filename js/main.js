const parseTime = d3.timeParse("%Y-%m-%d");

d3.dsv("|", '/data/cincy311_cleaned_partial.tsv')
.then(data => {
    console.log(data[0]);
    console.log(data.length);
    data.forEach(d => {
      d.longitude = +d.longitude; //make sure these are not strings
      d.latitude = +d.latitude; //make sure these are not strings
      d.requested_datetime = new Date(d.requested_datetime).toDateString();
      d.requested_day = new Date(d.requested_date).getDay();
      d.service_code = d.service_code.replace(/["]+/g, "");
      d.service_name = d.service_name.replace(/["]+/g, "");
      d.updated_date = new Date(d.updated_date);
      d.requested_date = new Date(d.requested_date)
      d.updateTime = Math.ceil(Math.abs(d.updated_date - d.requested_date)/(1000 * 60 * 60 * 24)); // Time in days between request and update
      d.request_into_year = d.requested_date.getMonth();
    });

    // Initialize chart and then show it
    //colorsOption = new colorsOption({parentElement: '#map-colors'}, format_map_option_data(format_barchart(data, "service_code"), "service_code"));
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);

    requested_datetime_linechart = new FocusContextVis({parentElement: '#requested_datetime_linechart'}, 
                                                        format_barchart(data, "requested_datetime"), 
                                                        "requested_datetime");
    
    chart_sort(requested_datetime_linechart);
    requested_datetime_linechart.updateVis();

    requested_day_barchart = new Barchart({parentElement: '#requested_day_barchart'},
                                                        format_barchart(data, "requested_day"),
                                                        "requested_day");
    requested_day_barchart.updateVis();

    service_name_barchart = new Barchart({parentElement: '#service_name_barchart'},
                                                        format_barchart(data, "service_name"),
                                                        "service_name");
    service_name_barchart.updateVis();

    zipcode_barchart = new Barchart({parentElement: '#zipcode_barchart'},
                                                        format_barchart(data, "zipcode"),
                                                        "zipcode");
    zipcode_barchart.updateVis();

    update_time_histogram = new Histogram({ parentElement: '#update_time_chart'}, 
                                    data, 
                                    "updateTime");
    update_time_histogram.updateVis();

  })
  .catch(error => console.error(error));


// Create an object from rolled up data and assign it to templated "x" and "y" fields
function format_barchart(data, field){
  data_rollup = d3.rollup(data, v => v.length, d => d[field])
  let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({"x": k, "y" : v})));
  return myObjStruct;
}

function chart_sort(chart){
  chart.data.sort((a,b) => a.x - b.x);
  return;
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
})
