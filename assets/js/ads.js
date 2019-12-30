/**
 * This file is intended to detect active ad blocker.
 *
 * Ad blockers block URLs containing the word "ads" including this file.
 * If the file does load, `googlesitekit.canAdsRun` is set to true.
 */

window.googlesitekit = window.googlesitekit || {};
window.googlesitekit.canAdsRun = true;

// Ensure that this flag does not get wiped at a later stage during pageload.
document.addEventListener( 'DOMContentLoaded', function() {
	window.googlesitekit.canAdsRun = true;
} );
