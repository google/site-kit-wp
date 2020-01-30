/**
 * External dependencies
 */
import intlLocalesSupported from 'intl-locales-supported';
import intl from 'intl';
import React from 'react';

if ( global.Intl ) {
	// Check for locales other than American English.
	if ( ! intlLocalesSupported( [ 'en-US', 'de-DE' ] ) ) {
		global.Intl.NumberFormat = intl.NumberFormat;
		global.Intl.DateTimeFormat = intl.DateTimeFormat;
	}
} else {
	throw new Error( 'Your version of node is very old and does not support `Intl`. Please use at least node 10.' );
}

// The rest of our code relies on a global, external React being available.
global.React = React;

// eslint-disable-next-line no-undef
global.googlesitekit = {
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
global.gtag = function( type, name, sendto, category, label, value ) {
	return {
		type,
		name,
		sendto,
		category,
		label,
		value,
	};
};

global._googlesitekitBase = global._googlesitekitBase || {};

global._googlesitekitBase.apiFetchRootURL = 'http://sitekit.test/';
global._googlesitekitBase.apiFetchNonceMiddleware = '6af976d56d';
global._googlesitekitBase.apiFetchNonceEndpoint = 'http://sitekit.test/wp-admin/admin-ajax.php?action=rest-nonce';
