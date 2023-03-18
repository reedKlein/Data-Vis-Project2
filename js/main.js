const parseTime = d3.timeParse("%Y-%m-%d");

d3.dsv("|", '/data/cincy311_cleaned_partial.tsv')
.then(data => {
    console.log(data[0]);
    console.log(data.length);
    data.forEach(d => {
      d.longitude = +d.longitude; //make sure these are not strings
      d.latitude = +d.latitude; //make sure these are not strings
      d.requested_datetime = new Date(d.requested_datetime).toDateString();
    });

    // Initialize chart and then show it
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
