class Histogram{
    constructor(_config, _data, _type, _xAxisLab, _yAxisLab, _title) {
        // Configuration object with defaults
        this.config = {
          parentElement: _config.parentElement,
          logRange: _config.logRange || .5,
          containerWidth: _config.containerWidth || 500,
          containerHeight: _config.containerHeight || 300,
          margin: _config.margin || {top: 10, right: 15, bottom: 45, left: 50},
          logScale: _config.logScale || false,
          tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.type = _type;
        this.xAxisLab = _xAxisLab;
        this.yAxisLab = _yAxisLab
        this.title = _title;
        this.nBins = 20;
        this.initVis();
      }

    initVis(){
        let vis = this;
        var data = this.data;
        // set the dimensions and margins of the graph
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);

        // append the svg object to the body of the page
        vis.chart = d3.select(vis.config.parentElement)
        .attr("width", vis.width + vis.config.margin.left + vis.config.margin.right)
        .attr("height", vis.height + vis.config.margin.top + vis.config.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);
        
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.chart.append('text')
        .attr("text-anchor", 'middle')
        .attr('x', vis.width/2)
        .attr('y', vis.height + 40)
        .text(vis.xAxisLab)
        .attr('class', 'x-axis-label');

        vis.chart.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -((vis.height + vis.config.margin.top + vis.config.margin.bottom + 50)/2))
        .attr('y', -40)
        .text(vis.yAxisLab)
        .attr('class', 'y-axis-label');

        
    }

    updateVis(){
        let vis = this;
        var data = this.data;

         // X axis: scale and draw:
         vis.xScale = d3.scaleLinear()
         .domain([0, d3.max(data, function(d) { return +d.updateTime })])     //Update tomain in updates
         .range([1, vis.width]);

        // set the parameters for the histogram
        vis.histogram = d3.histogram()
        .value(function(d) { return d.updateTime; })   // I need to give the vector of value
        .domain(vis.xScale.domain())  // then the domain of the graphic
        .thresholds(vis.xScale.ticks(vis._boundsCheck(vis.nBins))); // then the numbers of bins

        // And apply this function to data to get the bins
        vis.bins = vis.histogram(data);

        // Y axis: scale and draw:
        if(vis.config.logScale){
            vis.yScale = d3.scaleLog()
            .domain([vis.config.logRange, d3.max(vis.bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
            vis.yScale.range([vis.height, 0]);
            vis.xAxis = d3.axisBottom(vis.xScale)
            vis.yAxis = d3.axisLeft(vis.yScale)
                .ticks(2, formatPower);

            function formatPower(d){
                const e = Math.log10(d);
                if (e !== Math.floor(e)) return; // Ignore non-exact power of ten.
                return `10${(e + "").replace(/./g, c => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c] || "⁻")}`;
            };
        }
        else{
            vis.yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
            vis.yScale.range([vis.height, 0]);

            vis.xAxis = d3.axisBottom(vis.xScale)
                //.tickFormat(d3.format('.1s'));
            vis.yAxis = d3.axisLeft(vis.yScale);
        }

        this.renderVis();
    }

    renderVis(){
        let vis = this;
        
        // append the bar rectangles to the svg element
        let rects = vis.chart.selectAll(".rect")
        .data(vis.bins)
        .join("rect");

        rects
        .transition().duration(1000)
            .attr("class", "rect")
            .attr("transform", function(d) { return "translate(" + vis.xScale(d.x0) + "," + vis.yScale(d.length) + ")"; })
            .attr("width", function(d) { return vis.xScale(d.x1) - vis.xScale(d.x0) -1 ; })
            .attr("height", function(d) { return vis.height - vis.yScale(d.length); })
            .style("fill", "#E00122");

        rects
            // Show tooltip on hover
            .on('mouseover', (event,d) => {
                d3.select('#tooltip')
                .style('opacity', 1)
                // Format number with million and thousand separator
                .html(`<div class="tooltip-label">${d.x0}-${d.x1} days</div>${d3.format(',')(d.length)} requests`);
                })
            .on("mousemove", (event) => {
                d3.select('#tooltip')
                  .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
                  .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              })
            .on("mouseleave", () => {
                d3.select('#tooltip').style('opacity', 0);
              })
        
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);

    }
    
    _boundsCheck(nBins){
        let vis = this;
        if(nBins <= 1){
            document.getElementById("nBins").value = 1;
            return 0;
        }
        if(nBins > vis.xScale.domain()[1]){
            document.getElementById("nBins").value = vis.xScale.domain()[1];
            return vis.xScale.domain()[1];
        }
        return nBins;
    }
}

d3.select('#update_time_logScale').on('click', d=> {
    let ele = d3.select('#update_time_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    update_time_histogram.config.logScale = !update_time_histogram.config.logScale;
    update_time_histogram.updateVis();
  });