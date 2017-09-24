(function () {
    var beam_current = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/current/value");
    var lifetime = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/lifetime/value");
    var filling_pattern = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/filling_pattern/value");
    var since_mesg = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/Since_mesg/value");
    var sr_mode = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/Sr_mode/value");
    var operator_msg = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/Operator_message/value");

    var sr_mode_labels = [];

    //setup webix
    webix.attachEvent("onBeforeAjax", function (mode, url, params, x, headers) {
        headers["Authorization"] = "Basic " + btoa("tango-cs:tango");
        headers["Accept"] = "*/*";
    });


    var mainLoop = function () {
        $$("operator_msg").load(operator_msg);
        $$("lifetime").load(lifetime);
        $$("since_mesg").load(since_mesg);
        $$("filling_pattern").load(filling_pattern);
        $$("sr_mode").load(sr_mode);

        $$("currentValue").load(beam_current);
        $$("lastUpdated").load(beam_current);
        $$("chart").load(beam_current);
    };

    //create UI
    var main = webix.ui({
        id: "app",
        container: "app",
        rows: [
            {
                view: "template",
                type: "header",
                template: "Welcome to Tango Controls demo web application. This simple application requests current value from ESRF, Grenoble"
            },
            {
                cols: [
                    {
                        id: "currentValue",
                        template: function (response) {
                            var current = response.value ? response.value.toFixed(3) : NaN;
                            return "Current: <b>" + current + "</b> mA";
                        },
                        height: 30
                    },
                    {
                        id: "lifetime",
                        template: function (response) {
                            var value = response.value ? response.value : NaN;
                            return "Lifetime: <b>" + (value/360).toFixed(2) + "</b> Hours";
                        },
                        height: 30
                    },
                    {
                        id: "since_mesg",
                        template: "Since message: <b>#value#</b>",
                        height: 30
                    },
                    {
                        id: "filling_pattern",
                        template: "Filling pattern: <b>#value#</b>",
                        height: 30
                    },
                    {
                        id: "sr_mode",
                        template: function(response){
                            return "Sr mode: <b>" + sr_mode_labels[response.value] + "</b>";
                        },
                        height: 30
                    }
                ]
            },
            {
                cols: [
                    {
                        id: "operator_msg",
                        template: "Operator message: <b>#value#</b>",
                        height: 30,
                        colspan: 3
                    }
                ]
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
                label: function (response) {
                    return response.value.toFixed(3);
                },
                xAxis: {
                    template: function (response) {
                        return webix.Date.dateToStr("%H:%i:%s")(new Date(response.timestamp));
                    }
                },
                yAxis: {},
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
                cols: [
                    {
                        rows: [
                            {
                                type: "header",
                                template: "Beam current history:"
                            },
                            {
                                template: '<div id="placeholder" class="demo-container" style="width:100%;"></div><div id="overview" class="demo-container" style="height: 150px"></div>'
                            }
                        ]
                    },
                    {
                        rows: [
                            {
                                type: "header",
                                template: "Here is the explanation:"
                            },
                            {
                                template: '<img class="demo" src="images/demo_2.png"/><p>The diagram above is quite self explanatory. Basically your computer accesses this application deployed somewhere. In its turn this application connects to Tango REST API deployed at ESRF. This REST API exports some read-ony data from the ESRF\'s Tango infrastructure.</p>'
                            }
                        ]
                    }

                ]
            }
        ]
    });

    document.getElementById("loading").remove();

    webix.event(window, "resize", function(){ main.adjust(); });

    webix.extend($$("app"), webix.ProgressBar);
    $$("app").showProgress({
        type: "icon",
        delay: 1000,
        hide: true
    });


    webix.ajax().get("https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/Sr_mode/properties").then(function(response) {
        debugger;
        sr_mode_labels = response.json()[0].values;
    });

    //set up flot
    webix.ajax().get("https://mstatus.esrf.fr/tango/rest/rc4/hosts/tangorest01.esrf.fr/10000/devices/sys/mcs/facade/attributes/current_history/value/plain").then(function (response) {
        var json = response.json();
        var d = [];
        for (var i = 0; i < json.width; ++i) {
            d.push([json.data[i], json.data[i + json.width]]);
        }

        var options = {
            series: {
                lines: {
                    fill: true
                }
            },
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
                    fill: true,
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
            $.each(plot.getXAxes(), function (_, axis) {
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
