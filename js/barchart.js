class Barchart {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _type) {
      // Configuration object with defaults
      this.config = {
        parentElement: _config.parentElement,
        logRange: _config.logRange || .5,
        containerWidth: _config.containerWidth || 300,
        containerHeight: _config.containerHeight || 200,
        margin: _config.margin || {top: 10, right: 10, bottom: 25, left: 40},
        logScale: _config.logScale || false,
        tooltipPadding: _config.tooltipPadding || 15
      }
      this.data = _data;
      this.type = _type;
      this.initVis();
    }
    
    /**
     * Initialize scales/axes and append static elements, such as axis titles
     */
    initVis() {

      let vis = this;
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      // Initialize scales and axes
      // Important: we flip array elements in the y output range to position the rectangles correctly  
      vis.xScale = d3.scaleBand()
          .range([0, vis.width])
          .paddingInner(0.2);
  
      vis.xAxis = d3.axisBottom(vis.xScale)
          .tickSize(0, 0)
          .ticks(0);
  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);
  
      // SVG Group containing the actual chart; D3 margin convention
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Append empty x-axis group and move it to the bottom of the chart
      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`)
      
      // Append y-axis group 
      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');
      
      
    }
  
    /**
     * Prepare data and scales before we render it
     */
    updateVis() {
      let vis = this;
      
      // Specificy x- and y-accessor functions
      vis.xValue = d => d.x;
      vis.yValue = d => d.y;

      vis.xScale.domain(vis.data.map(vis.xValue));

      // Set variable Y scale for Logarithmic or Linear
      if (vis.config.logScale){
        vis.yScale = d3.scaleLog()

        vis.yScale.domain([vis.config.logRange, d3.max(vis.data, vis.yValue)]);
      }
      else{
        vis.yScale = d3.scaleLinear()
        
        vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);
      }

      vis.yScale.range([vis.height, 0]);

      vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSizeOuter(0);

      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements
     */
    renderVis() {
      let vis = this;

      vis.colorScale = (d) => {
        return "#b7c58d";
      }

      // Format tooltip for barchart types
      vis.tooltipSelect = (type, d) => {
        switch(type){
          case "sy_snum":
            return `<div class="tooltip-label">${d.x} star(s)</div>${d3.format(',')(d.y)} planet(s)`;
          case "sy_pnum":
            return `<div class="tooltip-label">${d.x} planet(s)</div>${d3.format(',')(d.y)} system(s)`;
          case "st_spectype":
            return `<div class="tooltip-label">star type: ${d.x}</div>${d3.format(',')(d.y)} planet(s)`;
          case "discoverymethod":
            return `<div class="tooltip-label">method: ${d.x}</div>${d3.format(',')(d.y)} planet(s)`;
          case "habitability":
            return `<div class="tooltip-label">status: ${d.x}</div>${d3.format(',')(d.y)} planet(s)`;
        }
        return `<div class="tooltip-label">${type}<br>${d.x}</div>${d3.format(',')(d.y)}`;
      }
  
      // Add rectangles
      vis.bars = vis.chart.selectAll('.bar')
          .data(vis.data, vis.xValue)
        .join('rect');
      
      vis.bars.style('opacity', 0.5)
        .transition().duration(1000)
          .style('opacity', 1)
          .style('fill', vis.colorScale(vis.type))
          .attr('class', 'bar')
          .attr('x', d => vis.xScale(vis.xValue(d)))
          .attr('width', vis.xScale.bandwidth())
          .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
          .attr('y', d => vis.yScale(vis.yValue(d)))
      
      
      // Tooltip event listeners
      vis.bars
          .on('mouseover', (event,d) => {
            d3.select('#tooltip')
              .style('opacity', 1)
              // Format number with million and thousand separator
              .html(vis.tooltipSelect(vis.type, d));
          })
          .on('mousemove', (event) => {
            d3.select('#tooltip')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('opacity', 0);
          })
          .on('click', (event, d) =>{
            handle_filter(d, vis.type);
          });
      
  
      // Update axes
      vis.xAxisG
          .transition().duration(1000)
          .call(vis.xAxis)

      if(this.type == "discoverymethod"){
        vis.xAxisG
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "translate(-5,0)rotate(-35)")
      }
  
      vis.yAxisG.call(vis.yAxis);
    }
  }
  
  