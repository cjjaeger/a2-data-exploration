$(function(){
// set the dimensions and margins of the graph
//http://databits.io/challenges/wordpress-dot-com-social-reciprocity-challenge
//https://bl.ocks.org/d3noob/6f082f0e3b820b6bf68b78f2f7786084
//https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172


d3.json("data/userData.json", function(error, allData) {
      if (error) throw error;

      var margin = {
           left: 70,
           bottom: 100,
           top: 50,
           right: 50
       };

       // Height and width of the total area
       var height = 600;
       var width = 1000;
       var eventType = "follow";

       // Height/width of the drawing area for data symbols
       var drawHeight = height - margin.bottom - margin.top;
       var drawWidth = width - margin.left - margin.right;

       var svg = d3.select("#vis").append("svg")
           .attr("width", width)
           .attr("height", height);

      var g = svg.append("g")
          .attr("transform","translate(" + margin.left + "," + margin.top + ")")
          .attr("width", drawWidth)
          .attr("height", drawHeight);


      var xAxisLabel = svg.append('g')
          .attr('transform', 'translate(' + margin.left + ',' + (drawHeight + margin.top) + ')')
          .attr('class', 'axis');

      // Append a yaxis label to your SVG, specifying the 'transform' attribute to position it (don't call the axis function yet)
      var yAxisLabel = svg.append('g')
          .attr('class', 'axis')
          .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');

      var xAxisText = svg.append('text')
            .attr('transform', 'translate(' + (margin.left + drawWidth / 2) + ',' + (drawHeight + margin.top + 40) + ')')
            .attr('class', 'title');

        // Append text to label the y axis (don't specify the text yet)
      var yAxisText = svg.append('text')
        .attr('transform', 'translate(' + (margin.left - 40) + ',' + (margin.top + drawHeight / 2) + ') rotate(-90)')
        .attr('class', 'title');

      // set the ranges
      var xScale = d3.scaleTime();
      var yScale = d3.scaleLinear();
      var xAxis =d3.axisBottom(xScale);
      var yAxis = d3.axisLeft(yScale);
      // define the line
      var valueline = d3.line()
          .x(function(d) {return xScale(new Date(d.key));})
          .y(function(d) { return yScale(d.value)|| 0; });

      // format the data



    var setScales = function(data) {
        var minDate= new Date(data[0].key);
        var maxDate= new Date(data[data.length-1].key);
        xScale.range([0, drawWidth]).domain([minDate, maxDate]);
        yScale.range([drawHeight, 0]).domain([0, d3.max(data, function(d) { return d.value; })]);
    }
    var setAxes = function() {
        xAxis.scale(xScale);
        yAxis.scale(yScale);
        xAxisLabel.transition().duration(1500).call(xAxis);
        yAxisLabel.transition().duration(1500).call(yAxis);
        xAxisText.text('Time');
        yAxisText.text('Number of '+ eventType +"s per hour");
    }
    var parseTime = d3.timeParse("%Y-%m-%d %H");
    var formatTime = d3.timeFormat("%m-%d-%Y %H");
  var filterData = function() {

      var dataEvents = allData.map((user)=>{
          return user["user_events"].filter(function(event){
              return event.name == (eventType +"_out");
          });
      });

    var shot  =[].concat.apply([],  dataEvents);
console.log(shot);
    shot.forEach(function(d){
        if(!(d.date instanceof Date)){
        console.log(d.date);
        d.date = (d.date).substring(0,13);
        d.date = parseTime(d.date);
        }
    });
    //console.log(shot);
    var data = d3.nest()
       .key(function(d) { return d.date;})//grouping data by device
       .rollup(function(d) {
        return d.length;//gettting the count of each device group
    }).entries(shot);
    data.sort(function(a, b) {
      // a = new Date(a.key);
      // b = new Date(b.key);
      return new Date(a.key)<new Date(b.key) ? -1 : new Date(a.key)>new Date(b.key) ? 1 : 0;
    });
    return data;
}


var tip = d3.tip().attr('class', 'd3-tip').html((d) =>{
         return d.value+' '+ eventType+'s<br/>'+formatTime(new Date(d.key));
     });
    g.call(tip);

var draw = function(data){
    setScales(data);
    setAxes();
    var line =g.select("path")
        .data([data]);

        line.enter().append("path").merge(line)
        .transition().duration(1500)
        .style("fill", "none")
        .style("stroke", "steelblue")
        .style("stroke-width", "2px")
        .attr("d", valueline);

    var circles = g.selectAll('circle')
        .data(data);
    circles.enter().append("circle")
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .merge(circles)
        .transition().duration(1500)
        .attr("r", 5)
        .attr('fill', 'blue')
        .style('opacity', 0.3)
        .attr("cx", function(d) {return xScale(new Date(d.key));})
        .attr("cy", function(d) { return yScale(d.value); });

        circles.exit().remove();
}
var data = filterData();

    draw(data);
    g.append("path")
        .data([data])
       .attr("class", "line")
       .style("fill", "none")
       .style("stroke", "steelblue")
       .style("stroke-width", "2px")
       .attr("d", valueline(data));
    //  Add the valueline path.
    

      $("circle").tooltip({
               'container': 'body',
               'placement': 'top'
           });

      $("input").on('change', function() {
                  // Get value, determine if it is the sex or type controller
                  var val = $(this).val();
                  eventType = val;
                  // Filter data, update chart
                  var data = filterData();

                  draw(data);
        });
    });
});
