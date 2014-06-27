"use strict";

// Telemetry histograms.
var requiredMeasures = {
  "APPLICATION_REPUTATION_SHOULD_BLOCK" : 0
};

// Versions for which we have any data.
var channels = {
  nightly: [ "nightly/31", "nightly/32", "nightly/33" ],
  aurora: [ "aurora/31", "aurora/32" ],
  beta: [ "beta/31" ]
};
var currentChannel = "nightly";

// Minimum volume for which to display data
var minVolume = 1000;

// Array of [[version, measure]] for requesting loadEvolutionOverBuilds.
var versionedMeasures = [];

// Set up our series
var blockRate = {};
var blockVolume = {};
// Setup our highcharts on document-ready.
$(document).ready(function() {
  blockRateChart = new Highcharts.StockChart(blockRateOptions);
  //blockVolumeChart = new Highcharts.StockChart(blockVolumeOptions);
  //localChart = new Highcharts.StockChart(localOptions);
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
  Object.keys(requiredMeasures).forEach(function(m) {
    blockRate[requiredMeasures[m]] = [];
    blockVolume[requiredMeasures[m]] = [];
  });
  makeTimeseries(channel, channels[channel]);
}
// Sort [date, {rate|volume}] pairs based on the date
function sortByDate(p1, p2)
{
  return p1[0] - p2[0];
}

// Returns a promise that resolves when all of the versions for all of the
// required measures have been stuffed into the timeseries.
function makeTimeseries(channel, versions)
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
      for (var i in tsSeries) {
        blockRate[i] = blockRate[i].sort(sortByDate);
        blockVolume[i] = blockVolume[i].sort(sortByDate);
        blockRateChart.series[i].setData(blockRate[i], true);
        blockVolumeChart.series[i].setData(blockVolume[i], true);
      }
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
            blockRate[index].push([date.getTime(),
                                         data[1] / (data[0] + data[1])]);
            blockVolume[index].push([date.getTime(),
                                           data[0] + data[1]]);
          }
        });
        // We've collected all of the data for this version, so resolve.
        resolve(true);
      }
    );
  });
  return p;
}
