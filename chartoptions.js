"use strict";

// Data before June 9 2014 is not very interesting
var minDate = new Date(2014, 5, 9);

$(function() {
  Highcharts.setOptions({
    chart: {
      type: 'spline'
    },
    title: {
      x: -20 //center
    },
    xAxis: {
      type: 'datetime',
      minTickInterval: 24 * 3600 * 1000,
      //min: minDate.getTime()
    },
    yAxis: {
      min: 0
    },
  })
});

var blockRateChart;
var blockRateOptions = {
  legend: {
    enabled: true,
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 2
  },
  chart: {
    renderTo: 'blockRate'
  },
  title: {
    text: 'Download block rates'
  },
  yAxis: {
    title: {
      text: 'Block rate'
    },
  },
  series: [{ name: 'Block rate' }]
};

var volumeChart;
var volumeOptions = {
  legend: {
    enabled: true,
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 2
  },
  chart: {
    renderTo: 'volume'
  },
  title: {
    text: 'Download volume'
  },
  yAxis: {
    title: {
      text: 'Volume'
    },
  },
  series: [{ name: 'Blocked' },
           { name: 'Total' }]
};

var listChart;
var listOptions = {
  legend: {
    enabled: true,
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 2
  },
  chart: {
    renderTo: 'list'
  },
  title: {
    text: 'Local list hits'
  },
  yAxis: {
    title: {
      text: 'List'
    },
  },
  series: [{ name: 'Allow' },
           { name: 'Block' },
           { name: 'None' }
  ]
};

var sbChart;
var sbOptions = {
  legend: {
    enabled: true,
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 2
  },
  chart: {
    renderTo: 'safebrowsing'
  },
  title: {
    text: 'Safebrowsing warnings'
  },
  yAxis: {
    title: {
      text: 'Type'
    },
  },
  series: [{ name: 'Phishing' },
           { name: 'Malware' }
  ]
};
