(function () {
    var beam_current = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/current/value");
    var operator_msg = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/Operator_message/value");

    webix.attachEvent("onBeforeAjax", function (mode, url, params, x, headers) {
        headers["Authorization"] = "Basic " + btoa("tango-cs:tango");
    });

    var mainLoop = function () {
        $$("operator_msg").load(operator_msg);
        $$("currentValue").load(beam_current);
        $$("lastUpdated").load(beam_current);
        $$("chart").load(beam_current);
    };

    //create UI
    webix.ui({
        id: "app",
        container: "app",
        rows: [
            {
                view: "template",
                type: "header", template: "Welcome to Tango Controls demo web application. This simple application requests current value from ESRF, Grenoble"
            },
            {
                id: "currentValue",
                template: function(response){
                    var current = response.value ? response.value.toFixed(3) : NaN;
                    return "Current <b>" + current +"</b>";
                },
                height: 30
            },
            {
                id: "operator_msg",
                template: "Operator: #value#",
                height: 30
            },
            {
                id: "chart",
                view: "chart",
                type: "spline",
                value: "#value#",
                dynamic: true,
                cellWidth: 100,
                animateDuration: 300,
                height: 300,
                label: function(response){
                    return response.value.toFixed(3);
                },
                xAxis: {
                    template: function (response) {
                        return webix.Date.dateToStr("%H:%i:%s")(new Date(response.timestamp));
                    }
                },
                yAxis: {

                },
                series: [
                    {
                        value: "#value#",
                        item: {
                            borderColor: "#1293f8",
                            color: "#ffffff"
                        },
                        line: {
                            color: "#1293f8",
                            width: 2
                        },
                        tooltip: {
                            template: "#value#"
                        }
                    }
                ]
            },
            {
                id: "lastUpdated",
                template: function (response) {
                    return "Last updated @<b>" + new Date(response.timestamp) + "</b>"
                },
                type: "section"
            },
            {
                cols:[
                    {
                        rows:[
                            {
                                type: "header",
                                template:"Beam current history:"
                            },
                            {
                                template:'<div id="placeholder" class="demo-container"></div><div id="overview" class="demo-container" style="height: 150px;"></div>'
                            }
                        ]
                    },
                    {
                        rows:[
                            {
                                type: "header",
                                template:"Here is the explanation:"
                            },
                            {
                                template:'<object data="images/demo.svg" type="image/svg+xml" width="960px" height="720px"><!--<img src="yourfallback.jpg" />--></object>'
                            }
                        ]
                    }

                ]
            }
        ]
    });

    document.getElementById("loading").remove();

    webix.extend($$("app"), webix.ProgressBar);
    $$("app").showProgress({
        type: "icon",
        delay: 1000,
        hide: true
    });


    //set up flot
    webix.ajax().get("https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/current_history/value/plain").then(function(response){
        var json = response.json();
        var d = [];
        for(var i = 0; i < json.width; ++i){
            d.push([json.data[i],json.data[i + json.width]]);
        }

        var options = {
            xaxis: {
                mode: "time",
                tickLength: 5
            },
            selection: {
                mode: "x"
            }
        };


        var plot = $.plot("#placeholder", [d], options);

        var overview = $.plot("#overview", [d], {
            series: {
                lines: {
                    show: true,
                    lineWidth: 1
                },
                shadowSize: 0
            },
            xaxis: {
                ticks: [],
                mode: "time"
            },
            yaxis: {
                ticks: [],
                min: -1,
                autoscaleMargin: 0.1
            },
            selection: {
                mode: "x"
            }
        });

        // now connect the two

        $("#placeholder").bind("plotselected", function (event, ranges) {

            // do the zooming
            $.each(plot.getXAxes(), function(_, axis) {
                var opts = axis.options;
                opts.min = ranges.xaxis.from;
                opts.max = ranges.xaxis.to;
            });
            plot.setupGrid();
            plot.draw();
            plot.clearSelection();

            // don't fire event on the overview to prevent eternal loop

            overview.setSelection(ranges, true);
        });

        $("#overview").bind("plotselected", function (event, ranges) {
            plot.setSelection(ranges);
        });
    });




    setInterval(mainLoop, 1000);
})
();
