"use strict";

// Telemetry histograms.
var requiredMeasures = {
  "APPLICATION_REPUTATION_SHOULD_BLOCK" : 0
};

// Versions for which we have any data.
var channels = {
  nightly: [ "nightly/31", "nightly/32", "nightly/33" ],
  aurora: [ "aurora/31", "aurora/32" ],
  beta: [ "beta/26", "beta/27", "beta/28", "beta/27", "beta/29", "beta/30", "beta/31" ]
};
var currentChannel = "nightly";

// Minimum volume for which to display data
var minVolume = 1000;

// Array of [[version, measure]] for requesting loadEvolutionOverBuilds.
var versionedMeasures = [];

// Set up our series
var blockRate = [];
var blockVolume = [];
var volume = [];

// Local list results
var ALLOW = 0;
var BLOCK = 1;
var NONE = 2;
var lists = { 0: [], 1: [], 2: [] };

// Phishing and malware results
var sbLabels = {
  PHISH_TOP: 0,
  PHISH_FRAME: 1,
  MALWARE_TOP: 2,
  MALWARE_FRAME: 3
};
var sbSeries = {};

// Setup our highcharts on document-ready.
$(document).ready(function() {
  blockRateChart = new Highcharts.StockChart(blockRateOptions);
  volumeChart = new Highcharts.StockChart(volumeOptions);
  listChart = new Highcharts.StockChart(listOptions);
  sbChart = new Highcharts.StockChart(sbOptions);
});

// Print auxiliary function
function print(line) {
  document.querySelector('#output').textContent += line + "\n";
};

function changeView(channel) {
  // Unselect the old channel
  document.querySelector("#" + currentChannel)
      .setAttribute("style", "background-color:white");
  currentChannel = channel;
  makeGraphsForChannel(currentChannel);
  // Select the new channel. The highlighted button uses the same green color as
  // Highcharts.
  document.querySelector("#" + currentChannel)
    .setAttribute("style", "background-color:#90ed7d");
}

// Initialize telemetry.js
Telemetry.init(function() {
  // For nightly versions, we only have one release per date, so we can
  // construct a single graph for all versions of nightly.
  changeView("nightly");
});

function makeGraphsForChannel(channel) {
  blockRate = [];
  blockVolume = [];
  volume = [];
  for (var i in lists) {
    lists[i] = [];
  }
  makeTimeseries(channels[channel]);
  makeListseries(channels[channel]);
  makeSBSeries(channels[channel]);
}

// Sort [date, {rate|volume}] pairs based on the date
function sortByDate(p1, p2)
{
  return p1[0] - p2[0];
}

// Returns a promise that resolves when all of the versions for all of the
// required measures have been stuffed into the timeseries.
function makeTimeseries(versions)
{
  // construct a single graph for all versions of nightly
  var promises = [];
  versions.forEach(function(v) {
    promises.push(makeTimeseriesForVersion(v));
  });
  return Promise.all(promises)
    .then(function() {
      // Wait until all of the series data has been returned before redrawing
      // highcharts.
      blockRate = blockRate.sort(sortByDate);
      blockVolume = blockVolume.sort(sortByDate);
      volume = volume.sort(sortByDate);
      blockRateChart.series[0].setData(blockRate, true);
      volumeChart.series[0].setData(blockVolume, true);
      volumeChart.series[1].setData(volume, true);
    });
}

// Returns a promise that resolves when all of the requires measures from the
// given version have had their timeseries added.
function makeTimeseriesForVersion(v)
{
  var promises = [];
  var p = new Promise(function(resolve, reject) {
    Telemetry.measures(v, function(measures) {
      for (var m in measures) {
        // Telemetry.loadEvolutionOverBuilds(v, m) never calls the callback if
        // the given measure doesn't exist for that version, so we must make
        // sure to only call makeTimeseries for measures that exist.
        if (m in requiredMeasures) {
          promises.push(makeTimeseriesForMeasure(v, m));
        }
      }
      resolve(Promise.all(promises));
    });
  });
  return p;
}

// Returns a promise that resolves when all of the data has been loaded for a
// particular measure. Don't redraw highcharts here because appending to the
// existing series data will cause a race condition in the event of multiple
// versions.
function makeTimeseriesForMeasure(version, measure) {
  var index = requiredMeasures[measure];
  var p = new Promise(function(resolve, reject) {
    Telemetry.loadEvolutionOverBuilds(version, measure,
      function(histogramEvolution) {
        histogramEvolution.each(function(date, histogram) {
          var data = histogram.map(function(count, start, end, index) {
            return count;
          });
          // Skip dates with fewer than 1000 submissions
          // shouldBlock: false = 0, true = 1
          if (data[0] + data[1] > minVolume) {
            date.setUTCHours(0);
            blockRate.push([date.getTime(), data[1] / (data[0] + data[1])]);
            blockVolume.push([date.getTime(), data[1]]);
            volume.push([date.getTime(), data[0] + data[1]]);
          }
        });
        // We've collected all of the data for this version, so resolve.
        resolve(true);
      }
    );
  });
  return p;
}

function makeListseries(versions) {
  var promises = [];
  versions.forEach(function(v) {
    promises.push(makeListseriesForVersion(v));
  });
  return Promise.all(promises)
    .then(function() {
      for (var i = ALLOW; i <= NONE; i++) {
        lists[i] = lists[i].sort(sortByDate);
        listChart.series[i].setData(lists[i], true);
      }
    });
}

function makeListseriesForVersion(version)
{
  var measure = "APPLICATION_REPUTATION_LOCAL";
  var p = new Promise(function(resolve, reject) {
    Telemetry.loadEvolutionOverBuilds(version, measure,
      function(histogramEvolution) {
        histogramEvolution.each(function(date, histogram) {
          var data = histogram.map(function(count, start, end, index) {
            return count;
          });
          // Skip dates with fewer than 1000 submissions
          // shouldBlock: false = 0, true = 1
          if (data[ALLOW] + data[BLOCK] + data[NONE] > minVolume) {
            date.setUTCHours(0);
            for (var i = ALLOW; i <= NONE; i++) {
              lists[i].push([date.getTime(), data[i]]);
            }
          }
        });
        // We've collected all of the data for this version, so resolve.
        resolve(true);
      }
    );
  });
  return p;
}

function makeSBSeries(versions) {
  var promises = [];
  sbSeries = { 0: [], 1: [], 2: [], 3: [] };
  versions.forEach(function(v) {
    promises.push(makeSBSeriesForVersion(v));
  });
  return Promise.all(promises)
    .then(function() {
      for (var i in sbLabels) {
        sbSeries[sbLabels[i]] = sbSeries[sbLabels[i]].sort(sortByDate);
        print(JSON.stringify(sbSeries, undefined, 2));
        sbChart.series[sbLabels[i]].setData(sbSeries[sbLabels[i]], true);
      }
    });
}

function makeSBSeriesForVersion(version) {
  var measure = "SECURITY_UI";
  var WARNING_PHISHING_PAGE_TOP = 56;
  var WARNING_PHISHING_PAGE_FRAME = 64;
  var WARNING_MALWARE_PAGE_TOP = 52;
  var WARNING_MALWARE_PAGE_FRAME = 60;
  var p = new Promise(function(resolve, reject) {
    Telemetry.loadEvolutionOverBuilds(version, measure,
      function(histogramEvolution) {
        histogramEvolution.each(function(date, histogram) {
          var data = histogram.map(function(count, start, end, index) {
            return count;
          });
          date.setUTCHours(0);
          sbSeries[sbLabels.PHISH_TOP].push([date.getTime(),
            data[WARNING_PHISHING_PAGE_TOP]]);
          //sbSeries[sbLabels.PHISH_FRAME].push([date.getTime(),
          //  data[WARNING_PHISHING_PAGE_FRAME]]);
          sbSeries[sbLabels.MALWARE_TOP].push([date.getTime(),
            data[WARNING_MALWARE_PAGE_TOP]]);
          //sbSeries[sbLabels.MALWARE_FRAME].push([date.getTime(),
          //  data[WARNING_MALWARE_PAGE_FRAME]]);
        });
        // We've collected all of the data for this version, so resolve.
        resolve(true);
      }
    );
  });
  return p;
}
