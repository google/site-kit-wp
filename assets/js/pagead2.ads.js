/**
 * This file is intended to detect active ad blocker.
 *
 * Ad blockers block URLs containing the word "ads.js" including this file. The
 * popular AdBlock extension lets that pass though, hence the filename also
 * includes "pagead2" which is blocked by AdBlock.
 *
 * If the file does load, `googlesitekit.canAdsRun` is set to true. If the
 * AdSense datastore is loaded, an action to flag the adblocker inactive will
 * be dispatched.
 */

if ( global.googlesitekit === undefined ) {
	global.googlesitekit = {};
}

global._googlesitekitLegacyData.canAdsRun = true;

// Ensure that this flag does not get wiped at a later stage during pageload.
document.addEventListener( 'DOMContentLoaded', function() {
	global._googlesitekitLegacyData.canAdsRun = true;
} );

// If registry and AdSense datastore are loaded, use that instead of the global.
if (
	global.googlesitekit.data &&
	global.googlesitekit.data.dispatch &&
	global.googlesitekit.data.stores &&
	global.googlesitekit.data.stores[ 'modules/adsense' ]
) {
	global.googlesitekit.data.dispatch( 'modules/adsense' ).receiveIsAdBlockerActive( false );
}
