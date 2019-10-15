import React from 'react';

// The rest of our code relies on a global, external React being available.
global.React = React;

// eslint-disable-next-line no-undef
global.googlesitekit = {
	admin: {
		connectUrl: 'http://sitekit.withgoogle.com/wp-admin/admin.php?googlesitekit_connect=1&nonce=12345&page=googlesitekit-splash',
		adminRoot: 'http://sitekit.withgoogle.com/wp-admin/admin.php',
	},

	modules: {
		'search-console': {
			screenId: 'googlesitekit-module-search-console'
		},
		'pagespeed-insights': {
			screenId: 'googlesitekit-module-pagespeed-insights'
		}
	},

	setup: {

	},
};

// eslint-disable-next-line no-undef
global.gtag = function( type, name, sendto, category, label, value ) {
	return {
		type: type,
		name: name,
		sendto: sendto,
		category: category,
		label: label,
		value: value
	};
};
