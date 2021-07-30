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

global._googlesitekitLegacyData = {
	admin: {
		connectURL: 'http://example.com/wp-admin/index.php?action=googlesitekit_connect&nonce=abc123',
		adminRoot: 'http://example.com/wp-admin/admin.php',
	},
	modules: {
		'search-console': {
			slug: 'search-console',
			name: 'Search Console',
		},
		'pagespeed-insights': {
			slug: 'pagespeed-insights',
			name: 'PageSpeed Insights',
		},
		analytics: {
			slug: 'analytics',
			name: 'Analytics',
		},
		adsense: {
			slug: 'adsense',
			name: 'AdSense',
		},
		optimize: {
			slug: 'optimize',
			name: 'Optimize',
		},
		tagmanager: {
			slug: 'tagmanager',
			name: 'Tag Manager',
		},
	},
	setup: {

	},
};

global._googlesitekitUserData = {
	user: {},
};

global._googlesitekitBaseData = {};
global._googlesitekitEntityData = {};

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

global._googlesitekitBaseData = global._googlesitekitBaseData || {};
global._googlesitekitAPIFetchData = global._googlesitekitAPIFetchData || {};

global._googlesitekitAPIFetchData.rootURL = 'http://sitekit.test/';
global._googlesitekitAPIFetchData.nonceMiddleware = '6af976d56d';
global._googlesitekitAPIFetchData.nonceEndpoint = 'http://sitekit.test/wp-admin/admin-ajax.php?action=rest-nonce';

// Instantiate global to which we'll assign to the value imported from fetch-mock-jest during Jest's setupFilesAfterEnv execution.
global.fetchMock = undefined;
