/**
 * This file is intended to detect active ad blocker.
 *
 * Ad blockers block URLs containing the word "ads" including this file.
 * If the file does load, `googlesitekit.canAdsRun` is set to true.
 */

global.googlesitekit = global.googlesitekit || {};
global.googlesitekit.canAdsRun = true;

// Ensure that this flag does not get wiped at a later stage during pageload.
document.addEventListener( 'DOMContentLoaded', function() {
	global.googlesitekit.canAdsRun = true;
} );
