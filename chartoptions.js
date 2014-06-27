"use strict";

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
    renderTo: 'timeseries'
  },
  title: {
    text: 'Block rates'
  },
  yAxis: {
    title: {
      text: 'Block rate'
    },
  },
  series: [{ name: 'Block rate' }]
};
