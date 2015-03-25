safebrowsing-dashboard
=======================

Telemetry dashboard for application reputation.

## Download block rates

Including all of the checks, we're blocking 0.3% of the downloads that we call application reputation on (which should be most downloads, regardless of extension)

* <https://mxr.mozilla.org/mozilla-central/source/toolkit/components/downloads/ApplicationReputation.cpp#724>
* <https://mxr.mozilla.org/mozilla-central/source/toolkit/components/downloads/ApplicationReputation.cpp#1086>

## Download volume

Total number of downloads.

## Local list graph

* <https://mxr.mozilla.org/mozilla-central/source/toolkit/components/downloads/ApplicationReputation.cpp#327>
** we check all URIs in the redirect chain, so a long redirect chain will hit this graph more than once for a single download
** this graph doesn't have anything to do with the number of downloads

## Safebrowsing warnings

Number of times a page load is blocked for malware/phishing reasons (distinction between top-level page and just iframe).

* <https://mxr.mozilla.org/mozilla-central/source/docshell/base/nsDocShell.cpp#5092>
** we increment phishing/malware frame everytime we cancel a channel
** the non-iframe ones are where we show the UI
* <http://telemetry.mozilla.org/#filter=nightly%2F38%2FAPPLICATION_REPUTATION_SERVER%2Fsaved_session%2FFirefox&aggregates=multiselect-all!Submissions&evoOver=Builds&locked=true&sanitize=true&renderhistogram=Graph> shows the number of times we hit the application reputation server
* <http://telemetry.mozilla.org/#filter=nightly%2F39%2FAPPLICATION_REPUTATION_SERVER_VERDICT%2Fsaved_session%2FFirefox&aggregates=multiselect-all!Submissions&evoOver=Builds&locked=true&sanitize=true&renderhistogram=Graph> shows the verdicts we get out of the apprep server
