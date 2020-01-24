/**
 * External dependencies
 */
import intlLocalesSupported from 'intl-locales-supported';
import intl from 'intl';
import React from 'react';

if ( window.Intl ) {
	// Check for locales other than American English.
	if ( ! intlLocalesSupported( [ 'en-US', 'de-DE' ] ) ) {
		window.Intl.NumberFormat = intl.NumberFormat;
		window.Intl.DateTimeFormat = intl.DateTimeFormat;
	}
} else {
	throw new Error( 'Your version of node is very old and does not support `Intl`. Please use at least node 10.' );
}

// The rest of our code relies on a global, external React being available.
window.React = React;

// eslint-disable-next-line no-undef
window.googlesitekit = {
	admin: {
		connectURL: 'http://sitekit.withgoogle.com/wp-admin/admin.php?googlesitekit_connect=1&nonce=12345&page=googlesitekit-splash',
		adminRoot: 'http://sitekit.withgoogle.com/wp-admin/admin.php',
	},
	modules: {
		'search-console': {
			screenID: 'googlesitekit-module-search-console',
		},
		'pagespeed-insights': {
			screenID: 'googlesitekit-module-pagespeed-insights',
		},
	},
	setup: {

	},
};

// eslint-disable-next-line no-undef
window.gtag = function( type, name, sendto, category, label, value ) {
	return {
		type,
		name,
		sendto,
		category,
		label,
		value,
	};
};

global._apiFetchRootURL = 'http://sitekit.test/';
global._apiFetchNonceMiddleware = '6af976d56d';
global._apiFetchNonceEndpoint = 'http://sitekit.test/wp-admin/admin-ajax.php?action=rest-nonce';
