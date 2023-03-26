const parseTime = d3.timeParse("%Y-%m-%d");

d3.dsv("|", '/data/cincy311_cleaned_partial.tsv')
.then(data => {
    console.log(data[0]);
    console.log(data.length);
    data.forEach(d => {
      d.longitude = +d.longitude; //make sure these are not strings
      d.latitude = +d.latitude; //make sure these are not strings
      d.requested_datetime = new Date(d.requested_datetime).toDateString();
      d.service_code = d.service_code.replace(/["]+/g, "");
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
