/**
 * External dependencies
 */
import intlLocalesSupported from 'intl-locales-supported';
import intl from 'intl';

/**
 * WordPress dependencies
 */
import React from '@wordpress/element';

if ( global.Intl ) {
	// Check for locales other than American English.
	if ( ! intlLocalesSupported( [ 'en-US', 'de-DE' ] ) ) {
		global.Intl.NumberFormat = intl.NumberFormat;
		global.Intl.DateTimeFormat = intl.DateTimeFormat;
	}
} else {
	throw new Error(
		'Your version of node is very old and does not support `Intl`. Please use at least node 10.'
	);
}

// The rest of our code relies on a global, external React being available.
global.React = React;

global._googlesitekitLegacyData = {
	admin: {
		connectURL:
			'http://example.com/wp-admin/index.php?action=googlesitekit_connect&nonce=abc123',
	},
	setup: {},
};

global._googlesitekitUserData = {
	user: {},
	connectURL:
		'http://example.com/wp-admin/index.php?action=googlesitekit_connect&nonce=abc123',
};

global._googlesitekitBaseData = {
	storagePrefix: 'abc123',
};
global._googlesitekitEntityData = {};

global.GOOGLESITEKIT_VERSION = '1.23.0';

// eslint-disable-next-line no-undef
global.gtag = function ( type, name, sendto, category, label, value ) {
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
global._googlesitekitAPIFetchData.nonceEndpoint =
	'http://sitekit.test/wp-admin/admin-ajax.php?action=rest-nonce';

// Instantiate global to which we'll assign to the value imported from fetch-mock-jest during Jest's setupFilesAfterEnv execution.
global.fetchMock = undefined;

if ( global.document ) {
	// Provide a stub for createRange (needed for rendering Joyride components)
	global.document.createRange = () => ( {
		setStart: () => {},
		setEnd: () => {},
		commonAncestorContainer: {
			nodeName: 'BODY',
			ownerDocument: document,
		},
	} );
}

// Provide a stub for scrollTo, as it's not implemented by JSDOM. See https://github.com/jsdom/jsdom/pull/2626.
global.scrollTo = () => {};

// Provide the desktop viewport as default because SK is not mobile-first app. Global dimensions are used in the useWindowSize hook.
global.innerWidth = 1024;
global.innerHeight = 768;
