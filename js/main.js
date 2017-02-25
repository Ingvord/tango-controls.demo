(function () {
    var rest = webix.proxy("rest", "https://mstatus.esrf.fr/tango/rest/rc3/hosts/acudebian7.esrf.fr/10000/devices/sys/mcs/facade/attributes/current/value");
    var current_data = [];

    webix.attachEvent("onBeforeAjax", function (mode, url, params, x, headers) {
        headers["Authorization"] = "Basic " + btoa("tango-cs:tango");
    });

    var mainLoop = function () {
        $$("currentValue").load(rest);
        $$("lastUpdated").load(rest);
        $$("chart").load(rest);
    };

    webix.ui({
        id: "app",
        container: "app",
        height: 480,
        rows: [
            {
                view: "template",
                type: "header", template: "Tango Controls demo application."
            },
            {
                id: "currentValue",
                template: "Current <b>#value#</b>",
                height: 30
            },
            {
                id: "chart",
                view: "chart",
                type: "line",
                value: "#value#",
                dynamic: true,
                cellWidth: 100,
                animateDuration: 300,
                xAxis: {
                    template: function (response) {
                        return webix.Number.format(response.value, {
                            groupDelimiter: "",
                            groupSize: 0,
                            decimalDelimiter: ".",
                            decimalSize: 3
                        });
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
            }
        ]
    });

    document.getElementById("loading").remove();

    webix.extend($$("app"), webix.ProgressBar);
    $$("app").showProgress({
        type:"icon",
        delay:1000,
        hide: true
    });

    setInterval(mainLoop, 1000);
})();