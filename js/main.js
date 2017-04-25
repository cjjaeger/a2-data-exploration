$(function(){
// set the dimensions and margins of the graph
//http://databits.io/challenges/wordpress-dot-com-social-reciprocity-challenge
//https://bl.ocks.org/d3noob/6f082f0e3b820b6bf68b78f2f7786084
//https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172

    d3.json("data/userData.json", function(error, allData) {
        if (error) throw error;

        var margin = {
           left: 50,
           bottom: 100,
           top: 20,
           right: 20
         };

        // Height and width of the total area
        var height = 500;
        var width = 1000;
        var drawHeight = height - margin.bottom - margin.top ;
        var drawWidth = width - margin.left - margin.right;
        margin2 = {top: 430, right: 20, bottom: 30, left: 40};
        height2 = height - margin2.top - margin2.bottom;

        //gobal variable for data being fetched
        var eventType = "like";

        var svg = d3.select("#vis").append("svg")
            .attr("width", width)
            .attr("height", height);

        var g = svg.append("g")
            .attr("class", "focus")
            .attr("transform","translate( 0," + margin.top + ")")
            .attr("width", drawWidth)
            .attr("height", drawHeight);

        //g for the contents of the graph
        var circlesG = g.append("g").attr("clip-path", "url(#clip)")
            .attr("transform", "translate(" + margin.left+ "," + margin.top + ")")
            .attr("width", drawWidth - margin.left)
            .attr("height", drawHeight -margin.bottom);
        //g for the date slider
        var context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate( 0," + margin2.top + ")")
            .attr("width", drawWidth)
            .attr("height", height2);

        var xAxisLabel = g.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + (drawHeight + margin.top) + ')')
            .attr('class', 'axis axis--x');

        //label for the date slider
        var brushLabel = context.append("g")
              .attr("class", "axis axis--x")
              .attr('transform', 'translate(' + margin.left + ',' + height2 + ')');

        var yAxisLabel = g.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');

        var xAxisText = svg.append('text')
            .attr("transform",
            "translate(" + ((drawWidth + margin.right + margin.left)/2) + " ," +
                           (drawHeight + margin.top + margin.bottom) + ")")
            .attr('class', 'title');

        var yAxisText = svg.append('text')
            .attr('transform', 'translate(' + (margin.left - 40) + ',' + (margin.top + drawHeight / 2) + ') rotate(-90)')
            .attr('class', 'title');

        // set the ranges
        var xScale = d3.scaleTime();
        var yScale = d3.scaleLinear();
        //scales for the date slider
        var x2 = d3.scaleTime().range([0, drawWidth]);

        var xAxis =d3.axisBottom();
        var xAxis2 = d3.axisBottom();//axsis for the date slider
        var yAxis = d3.axisLeft();

        // define the line
        var valueline = d3.line()
            .x(function(d) {return xScale(new Date(d.key));})
            .y(function(d) { return yScale(d.value)|| 0; });

        var brush = d3.brushX();//xaxis for the date slider

        //the fill range for the date picker
        var brushFillLabel = context.append("g")
            .attr("class", "brush")
            .attr('transform', 'translate(' + margin.left + ',' + 0 + ')');
        //function for setting scales
        var setScales = function(data) {
            //getting the min and max date
            var minDate= new Date(data[0].key);
            var maxDate= new Date(data[data.length-1].key);
            xScale.range([0, drawWidth]).domain([minDate, maxDate]);
            yScale.range([drawHeight, 0]).domain([0, d3.max(data, function(d) { return d.value; })]);
            x2.domain(xScale.domain());
            //setting range on the date slider and adding callback for change
            brush.extent([[0, 0], [drawWidth, height2]])
            .on("brush end", brushed);
        }
        //function for setting axis
        var setAxes = function() {
            xAxis.scale(xScale);
            xAxis2.scale(x2);
            yAxis.scale(yScale);
            xAxisLabel.transition().duration(1500).call(xAxis);
            yAxisLabel.transition().duration(1500).call(yAxis);
            xAxisText.text('Date and time');
            yAxisText.text('Number of '+ eventType +"s per hour");
            //adding the axis and the date slider fill
            brushLabel.transition().duration(1500).call(xAxis2);
            brushFillLabel.call(brush)
                  .call(brush.move, xScale.range());
        }
        //time formaters
        var parseTime = d3.timeParse("%Y-%m-%d %H");
        var formatTime = d3.timeFormat("%m-%d-%Y %H");
        //function for filtering data
        var filterData = function() {
            //getting all of the user events of the chosen type
            var dataEvents = allData.map((user)=>{
                return user["user_events"].filter(function(event){
                    return event.name == (eventType +"_out");
                });
            });

            //making one array from the many user events arrays
            var shot  =[].concat.apply([],  dataEvents);
            shot.forEach(function(d){
                //checking to seeif it's already in date form
                if(!(d.date instanceof Date)){
                    d.date = (d.date).substring(0,13);
                    d.date = parseTime(d.date);
                }
            });
            var data = d3.nest()
                .key(function(d) { return d.date;})//grouping data by date
                .rollup(function(d) {
                return d.length;//gettting the count of each event
                }).entries(shot);
            //sorting data by date
            data.sort(function(a, b) {
                a = new Date(a.key);
                b = new Date(b.key);
                return  a < b ? -1 : a>b ? 1 : 0;
            });


            var minDate= new Date(data[0].key);
            var maxDate= new Date(data[data.length-1].key);
            //getting the complete date range for the date
            var date_range = d3.timeHours(minDate, maxDate, 1);
            for (var i = 0; i <data.length-1; i++) {
                //checking to see if there is a data point for the date
                if (!((new Date(data[i].key)).getTime() == date_range[i].getTime())){
                    //adding the date in with the value of zero
                    data.splice(i, 0, {key: date_range[i], value: 0});
                }
            }
            return data;
        }

        //making tooltip
        var tip = d3.tip().attr('class', 'd3-tip').html((d) =>{
            return d.value+' '+ eventType+'s<br/>'+formatTime(new Date(d.key));
        });
        //adding it to the dom
        g.call(tip);

        var draw = function(data){

            setScales(data);
            setAxes();

            var line =circlesG.select(".line")
                .data([data]);
            line.enter().append("path")
                .merge(line)
                .transition().duration(1500)
                .style("fill", "none")
                .style("stroke", "steelblue")
                .style("stroke-width", "2px")
                .attr("d", valueline);

            var circles = circlesG.selectAll('circle')
                .data(data);
            circles.enter().append("circle")
                .attr("cx", function(d) {return xScale(new Date(d.key));})
                .attr("cy", drawHeight)
                .attr('class', 'dot')
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
        circlesG.append("path").data([data])
            .attr("class", "line")
            .style("fill", "none")
            .style("stroke", "steelblue")
            .style("stroke-width", "2px")
            .attr("d", valueline);
        //  Add the valueline path.
        function brushed() {
            //getting the selected date slide
            var selection = d3.event.selection;
            xScale.domain(selection.map(x2.invert, x2));//translating it to the xscale
            //calling elements to change
            g.select(".line").attr("d", valueline);
            g.selectAll(".dot")
            .attr("cx", function(d) { return xScale(new Date(d.key)); })
            .attr("cy", function(d) { return yScale(d.value); });
            g.select(".axis--x").call(xAxis);
        }

        //tooltipstyle
        $("circle").tooltip({
            'container': 'body',
            'placement': 'top'
        });
        //input listener
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
