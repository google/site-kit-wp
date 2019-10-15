var valuesToTest;
var testFunctions = window.googlesitekit.testFunctions;

QUnit.module( 'Utility function tests' );

// Set up default admin data.
googlesitekit.admin = {
	connectUrl: 'http://sitekit.withgoogle.com/wp-admin/admin.php?googlesitekit_connect=1&nonce=12345&page=googlesitekit-splash',
	adminRoot: 'http://sitekit.withgoogle.com/wp-admin/admin.php',
};

googlesitekit.modules = {
	'search-console': {
		screenId: 'googlesitekit-module-search-console'
	},
	'pagespeed-insights': {
		screenId: 'googlesitekit-module-pagespeed-insights'
	}
};

/**
 * Test showErrorNotification.
 */
QUnit.test( 'showErrorNotification!', function ( assert ) {
	testFunctions.showErrorNotification();
	var value = wp.hooks.applyFilters( 'googlesitekit.ErrorNotification', [] );
	assert.equal( 'function', typeof value );
} );

/**
 * Test toggleConfirmModuleSettings.
 */
valuesToTest = [
	{
		moduleSlug: 'analytics',
		settingsState: { selectedAccount: '12345678' },
		expected: false
	},
	{
		moduleSlug: 'analytics',
		settingsState: { selectedAccount: '99999999' },
		expected: true
	},
];

valuesToTest.forEach( function( itemToTest ) {

	QUnit.test( 'toggleConfirmModuleSettings::' + itemToTest.moduleSlug, function ( assert ) {
		assert.equal ( '', '', '' );
		window.googlesitekit.modules = window.googlesitekit.modules || {};
		window.googlesitekit.modules.analytics = {
			settings: { accountId: '12345678' },
			setupComplete: true,
			confirm: true,
		};

		window.googlesitekit.modules.adsense = {
			settings: { accountId: '12345678' },
			setupComplete: false,
			confirm: true,
		};

		var value = testFunctions.toggleConfirmModuleSettings( itemToTest.moduleSlug, { selectedAccount: 'accountId' }, itemToTest.settingsState, true );
		assert.equal( value, itemToTest.expected, 'Expect toggleConfirmModuleSettings( \'' + itemToTest.moduleSlug + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test activateOrDeactivateModule.
 */
valuesToTest = [
	{
		moduleSlug: 'analytics',
		status: true,
		expected: true
	},
	{
		moduleSlug: 'analytics',
		status: false,
		expected: false
	},
	{
		moduleSlug: 'adsense',
		status: true,
		expected: true
	},
	{
		moduleSlug: 'adsense',
		status: false,
		expected: false
	},
]
valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'activateOrDeactivateModule::' + itemToTest.moduleSlug, function ( assert ) {
		var restApiClient = {
			setModuleActive: function( slug, status ) {
				return {
					then: function() {
						return status;
					}
				};
			}
		}
		var value = testFunctions.activateOrDeactivateModule( restApiClient, itemToTest.moduleSlug, itemToTest.status );
		assert.equal( value, itemToTest.expected, 'Expect activateOrDeactivateModule( \'' + itemToTest.status + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test extractTag
 */
valuesToTest = [
	{
		html: '<script src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXX-Y" async type="text/javascript"></script>',
		module: 'analytics',
		expected: 'UA-XXXXX-Y'
	},
	{
		html: '<script> window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date; ga(\'create\', \'UA-XXXXX-Y\', \'auto\'); ga(\'send\', \'pageview\'); </script><script async src=\'https://www.google-analytics.com/analytics.js\'></script>',
		module: 'analytics',
		expected: 'UA-XXXXX-Y'
	},
	{
		html: '<script> (function(i,s,o,g,r,a,m){i[\'GoogleAnalyticsObject\']=r;i[r]=i[r]||function(){ (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o), m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m) })(window,document,\'script\',\'https://www.google-analytics.com/analytics.js\',\'ga\'); ga(\'create\', \'UA-XXXXX-Y\', \'auto\'); ga(\'send\', \'pageview\'); </script>',
		module: 'analytics',
		expected: 'UA-XXXXX-Y'
	},
	{
		html: '<meta charset="UTF-8"><title>Site Kit for WordPress</title><link rel="dns-prefetch" href="//fonts.googleapis.com"></link>',
		module: 'analytics',
		expected: null
	},
	{
		html: '<amp-analytics type="googleanalytics"><script type="application/json"> { "vars": { "account": "UA-XXXXX-Y" }, "triggers": { "default pageview": { "on": "visible", "request": "pageview", "vars": { "title": "Name of the Article" } } } } </script></amp-analytics>',
		module: 'analytics',
		expected: 'UA-XXXXX-Y'
	},
	{
		html: '<amp-analytics type="gtag" data-credentials="include"><script type="application/json">{"vars" : {"gtag_id": "UA-XXXXX-Y","config" : {"UA-XXXXX-Y": { "groups": "default" } } } }</script>',
		module: 'analytics',
		expected: 'UA-XXXXX-Y'
	},
	{
		html: '<meta charset="UTF-8"><title>Site Kit for WordPress</title><link rel="dns-prefetch" href="//fonts.googleapis.com"></link>',
		module: 'adsense',
		expected: null
	},
	{
		html: '<script async src="http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script> <script> (adsbygoogle = window.adsbygoogle || []).push({ google_ad_client: "ca-pub-123456789", enable_page_level_ads: true }); </script>',
		module: 'adsense',
		expected: 'ca-pub-123456789'
	},
	{
		html: '<amp-auto-ads type="adsense" data-ad-client="ca-pub-123456789"></amp-auto-ads>',
		module: 'adsense',
		expected: 'ca-pub-123456789'
	},
	{
		html: '<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX"></script>',
		module: 'tagmanager',
		expected: 'GTM-XXXXXXX'
	},
	{
		html: '<amp-analytics config="https://www.googletagmanager.com/amp.json?id=GTM-XXXXXXX" data-credentials="include" class="i-amphtml-element i-amphtml-layout-fixed i-amphtml-layout-size-defined i-amphtml-layout" i-amphtml-layout="fixed" aria-hidden="true" style="width: 1px; height: 1px;" hidden=""></amp-analytics>',
		module: 'tagmanager',
		expected: 'GTM-XXXXXXX'
	},
	{
		html: '<meta charset="UTF-8"><title>Site Kit for WordPress</title><link rel="dns-prefetch" href="//fonts.googleapis.com"></link>',
		module: 'tagmanager',
		expected: null
	},
	{
		html: [
			'<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':',
			'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],',
			'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=',
			'\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);',
			'})(window,document,\'script\',\'dataLayer\',\'GTM-XXXXXXX\');</script>',
		].join( "\n" ),
		module: 'tagmanager',
		expected: 'GTM-XXXXXXX'
	},
	{
		html: [
			'<script data-cfasync="false">//<![CDATA[',
			'(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':',
			'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],',
			'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=',
			'\'//www.googletagmanager.com/gtm.\'+\'js?id=\'+i+dl;f.parentNode.insertBefore(j,f);',
			'})(window,document,\'script\',\'dataLayer\',\'GTM-XXXXXXX\');//]]>',
			'</script>',
		].join( "\n" ),
		module: 'tagmanager',
		expected: 'GTM-XXXXXXX'
	},
]
valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'extractTag::' + itemToTest.html, function ( assert ) {
		var value = testFunctions.extractTag( itemToTest.html, itemToTest.module );
		assert.equal( value, itemToTest.expected, 'Expect extractTag( \'' + itemToTest.html + '\' ) to return ' + itemToTest.expected );
	} );
} );


/**
 * Test storageAvailable.
 */
valuesToTest = [
	{
		type: 'localStorage',
		expected: true,
		disableStorage: false
	},
	{
		type: 'sessionStorage',
		expected: true,
		disableStorage: false
	},
	{
		type: 'localStorage',
		expected: false,
		disableStorage: true
	},
	{
		type: 'sessionStorage',
		expected: false,
		disableStorage: true
	},
	{
		type: 'nonExistantStorage',
		expected: false,
		disableStorage: false
	},

]
const setItem = Storage.prototype.setItem;
valuesToTest.forEach( function( itemToTest ) {

	QUnit.test( 'storageAvailable::' + itemToTest.type, function ( assert ) {
		if ( itemToTest.disableStorage ) {
			Storage.prototype.setItem = function () { throw new Error( 'error' ); };
		}
		var value = testFunctions.storageAvailable( itemToTest.type );
		Storage.prototype.setItem = setItem;
		assert.equal( value, itemToTest.expected, 'Expect storageAvailable( \'' + itemToTest.type + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test sendAnalyticsTrackingEvent.
 */
var gtag = function( type, name, sendto, category, label, value ) {
	return {
		type: type,
		name: name,
		sendto: sendto,
		category: category,
		label: label,
		value: value
	};
};

var sendAnalyticsTrackingEventExpected = '{"type":"event","name":"name","sendto":{"event_category":"category","event_label":"label","event_value":"value","dimension1":"","dimension2":"true"}}';
QUnit.test( 'sendAnalyticsTrackingEvent', function ( assert ) {
	window.googlesitekit.admin.trackingOptin = true;
	const value = JSON.stringify( testFunctions.sendAnalyticsTrackingEvent( 'category', 'name', 'label', 'value' ) );
	assert.equal( value, sendAnalyticsTrackingEventExpected, 'Expect sendAnalyticsTrackingEvent( \'category\', \'name\', \'label\', \'value\' ) to return ' + sendAnalyticsTrackingEventExpected );
} );

/**
 * Test appendNotificationsCount.
 */
var appendNotificationsCountexpected = '<span class="plugin-count" aria-hidden="true">1</span><span class="screen-reader-text">1 notification</span>';
const wrapper = document.createElement( 'span' );
wrapper.setAttribute( 'id', 'wp-admin-bar-google-site-kit' );
const inner = document.createElement( 'span' );
inner.setAttribute( 'class', 'ab-item' );
wrapper.appendChild( inner );

document.body.appendChild( wrapper );

QUnit.test( 'appendNotificationsCount', function ( assert ) {
	var value = testFunctions.appendNotificationsCount( 1 ).innerHTML;
	assert.equal( value, appendNotificationsCountexpected, 'Expect appendNotificationsCount() to return ' + appendNotificationsCountexpected );
} );

/**
 * Test validateOptimizeID.
 */
valuesToTest = [
	{
		stringToValidate: 'GTM-XXXXXXX',
		expected: true
	},
	{
		stringToValidate: 'GTM-XXXXXX',
		expected: false
	},
	{
		stringToValidate: 'GTM-1234567',
		expected: true
	},
	{
		stringToValidate: 'GTMXXXXXXXX',
		expected: false
	},
	{
		stringToValidate: 'gtm-xxxxxxx',
		expected: false
	},

]

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'validateOptimizeID::' + itemToTest.stringToValidate, function ( assert ) {
		var value = testFunctions.validateOptimizeID( itemToTest.stringToValidate );
		assert.equal( !! value, itemToTest.expected, 'Expect validateOptimizeID( \'' + itemToTest.stringToValidate + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test validateJSON.
 */
valuesToTest = [
	{
		stringToValidate: '{"foo":"bar"}',
		expected: true
	},
	{
		stringToValidate: '{"foo":"bar","x":1,"y":true}',
		expected: true
	},
	{
		stringToValidate: '{"foo":"bar"',
		expected: false
	},
	{
		stringToValidate: '',
		expected: false
	},
	{
		stringToValidate: false,
		expected: false
	},
];

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'validateJSON::' + itemToTest.stringToValidate, function ( assert ) {
		var value = testFunctions.validateJSON( itemToTest.stringToValidate );
		assert.equal( value, itemToTest.expected, 'Expect validateJSON( \'' + itemToTest.stringToValidate + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test isFrontendIframeLoaded.
 */
var document = {
	getElementById: function() {
		return false;
	}
};

QUnit.test( 'isFrontendIframeLoaded', function ( assert ) {
	var value = testFunctions.isFrontendIframeLoaded();
	assert.equal( value, false, 'Expect isFrontendIframeLoaded() to return false' );
} );

document = {
	getElementById: function( id ) {
		return 'sitekit_fe_load_check' === id;
	}
};

QUnit.test( 'isFrontendIframeLoaded', function ( assert ) {
	var value = testFunctions.isFrontendIframeLoaded();
	assert.equal( value, false, 'Expect isFrontendIframeLoaded() to return false' );
} );

/**
 * Test getSiteKitAdminURL.
 */
valuesToTest = [
	{
		page: 'googlesitekit-dashboard',
		args: { foo: 'bar' },
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard&foo=bar'
	},
	{
		page: 'googlesitekit-dashboard',
		args: { foo: 'bar' },
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard&foo=bar'
	},
	{
		page: 'googlesitekit-dashboard',
		args: { foo: 'bar', x: 1 },
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard&foo=bar&x=1'
	},
	{
		page: 'googlesitekit-search-console',
		args: { foo: 'bar' },
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-search-console&foo=bar'
	},
	{
		page: 'googlesitekit-dashboard',
		args: { bar: 'foo' },
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard&bar=foo'
	},
	{
		page: undefined,
		args: {},
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard'
	},
];

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'getSiteKitAdminURL::' + itemToTest.page, function ( assert ) {
		var value = testFunctions.getSiteKitAdminURL( itemToTest.page,  itemToTest.args );
		assert.equal( value, itemToTest.expected, 'Expect getSiteKitAdminURL( \'' + itemToTest.page + ', ' +  itemToTest.args +  '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test fillFilterWithComponent.
 */
var filterTester = function( value ) {
	return '::added::';
};

var React = {};
React.createElement = function( a ) {
	return a( '' );
};

wp.hooks.addFilter( 'googlesitekit.Test',
	'googlesitekit.AdSenseModuleSettingsDetails',
	testFunctions.fillFilterWithComponent( filterTester, {} ) );


QUnit.test( 'fillFilterWithComponent::', function ( assert ) {
	var value = wp.hooks.applyFilters( 'googlesitekit.Test', 'test' )();
	assert.equal( value, '::added::', 'Expect fillFilterWithComponent to return ::added::' );
} );

/**
 * Test getReAuthUrl.
 */
valuesToTest = [

	{
		slug: 'pagespeed-insights',
		status: false,
		apikey: false,
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard&reAuth=false&slug=pagespeed-insights'
	},
	{
		slug: 'pagespeed-insights',
		status: true,
		apikey: false,
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-module-pagespeed-insights&reAuth=false&slug=pagespeed-insights'
	},
	{
		slug: 'pagespeed-insights',
		status: false,
		apikey: 'abc123',
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard&reAuth=false&slug=pagespeed-insights'
	},
	{
		slug: 'pagespeed-insights',
		status: true,
		apikey: 'abc123',
		expected: 'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-module-pagespeed-insights&reAuth=false&slug=pagespeed-insights'
	},
];

// Replace addQueryArgs to avoid webpack issue.
const addQueryArgs = function( url, args ) {
	var add = '';
	_.forEach( args, function( arg, key ) {
		if ( arg ) {
			add = add + key + '=' + arg + '&';
		}
	} );

	var toReturn = ( url + '?' + add );
	return toReturn.substr( 0, toReturn.length - 1 );
};

valuesToTest.forEach( function( itemToTest ) {
	googlesitekit.admin.apikey = itemToTest.apikey;
	QUnit.test( 'getReAuthUrl::' + itemToTest.slug, function ( assert ) {

		wp.url.addQueryArgs = addQueryArgs;
		var value = testFunctions.getReAuthUrl( itemToTest.slug, itemToTest.status );
		assert.equal( value, itemToTest.expected, 'Expect getReAuthUrl( \'' + itemToTest.slug + ', ' + itemToTest.status + ', ' + itemToTest.apikey  + '\' ) to return ' + itemToTest.expected );
	} );
} );


/**
 * Test extractForSparkline.
 */
valuesToTest = [
	{
		data: [
			[ '1/1/2019', 1, 2, 3, ],
			[ '1/2/2019', 4, 5, 6, ],
		],
		column: 1,
		expected: [
			[ '1/1/2019', 1 ],
			[ '1/2/2019', 4 ]
		]
	},
	{
		data: [
			[ '1/1/2019', 1, 2, 3, ],
			[ '1/2/2019', 4, 5, 6, ],
		],
		column: 2,
		expected: [
			[ '1/1/2019', 2 ],
			[ '1/2/2019', 5 ]
		]
	},
	{
		data: [
			[ '1/1/2019', 1, 2, 3, ],
			[ '1/2/2019', 4, 5, 6, ],
		],
		column: 3,
		expected: [
			[ '1/1/2019', 3 ],
			[ '1/2/2019', 6 ]
		]
	},
	{
		data: [
			[ '1/1/2019', 1, 2, 3, ],
			[ '1/2/2019', 4, 5, 6, ],
		],
		column: 0,
		expected: [
			[ '1/1/2019', '1/1/2019' ],
			[ '1/2/2019', '1/2/2019' ]
		]
	},
];

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'extractForSparkline::' + itemToTest.data, function ( assert ) {
		window.history.pushState( {}, '', itemToTest.search );
		var value = testFunctions.extractForSparkline( itemToTest.data, itemToTest.column );
		assert.deepEqual( value, itemToTest.expected, 'Expect extractForSparkline( \'' + itemToTest.data + ', ' + itemToTest.column + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test getQueryParameter.
 */
valuesToTest = [
	{
		search: '?foo=bar&x=1',
		parameter: 'foo',
		expected: 'bar'
	},
	{
		search: '?bar=foo&x=1',
		parameter: 'bar',
		expected: 'foo'
	},
	{
		search: '?foo=bar&x=1',
		parameter: 'x',
		expected: '1'
	},
	{
		search: '?foo=bar&y=2&x=1',
		parameter: 'y',
		expected: '2'
	},
];

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'getQueryParameter::' + itemToTest.parameter, function ( assert ) {
		window.history.pushState( {}, '', itemToTest.search );
		var value = testFunctions.getQueryParameter( itemToTest.parameter );
		assert.equal( value, itemToTest.expected, 'Expect getQueryParameter( \'' + itemToTest.parameter + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test getDaysBetweenDates.
 */
valuesToTest = [
	{
		dateStart: new Date( 'January 1, 2000 00:00:00' ),
		dateEnd:   new Date( 'January 2, 2000 00:00:00' ),
		expected: 1
	},
	{
		dateStart: new Date( 'January 1, 2000 00:00:00' ),
		dateEnd:   new Date( 'Feb 1, 2000 00:00:00' ),
		expected: 31
	},
	{
		dateStart: new Date( 'January 1, 2000 00:00:00' ),
		dateEnd:   new Date( 'January 1, 2001 00:00:00' ),
		expected: 366
	},
	{
		dateStart: new Date( 'January 1, 2000 00:00:00' ),
		dateEnd:   new Date( 'July 15, 2000 00:00:00' ),
		expected: 196
	},
	{
		dateStart: new Date( 'January 1, 2000 00:00:00' ),
		dateEnd:   new Date( 'April 7, 2012 00:00:00' ),
		expected: 4480
	},

];

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'getDaysBetweenDates::' + itemToTest.dateStart + itemToTest.dateEnd, function ( assert ) {
		var value = testFunctions.getDaysBetweenDates( itemToTest.dateStart, itemToTest.dateEnd );
		assert.equal( value, itemToTest.expected, 'Expect getDaysBetweenDates( \'' + itemToTest.dateStart + ', ' + itemToTest.dateEnd + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test numberFormat.
 */
valuesToTest = [
	{
		in: 123.87,
		expected: '123.87',
		locale: 'en-US',
	},
	{
		in: 1234.87,
		expected: '1,234.87',
		locale: 'en-US',
	},
	{
		in: 12345.87,
		expected: '12,345.87',
		locale: 'en-US',
	},
	{
		in: 123456.87,
		expected: '123,456.87',
		locale: 'en-US',
	},
	{
		in: 1234567.87,
		expected: '1,234,567.87',
		locale: 'en-US',
	},
	{
		in: 12345678.87,
		expected: '12,345,678.87',
		locale: 'en-US',
	},
	{
		in: 123456789.87,
		expected: '123,456,789.87',
		locale: 'en-US',
	},
	{
		in: 123.87,
		expected: '123,87',
		locale: 'de-DE',
	},
	{
		in: 1234.87,
		expected: '1.234,87',
		locale: 'de-DE',
	},
	{
		in: 12345.87,
		expected: '12.345,87',
		locale: 'de-DE',
	},
	{
		in: 123456.87,
		expected: '123.456,87',
		locale: 'de-DE',
	},
	{
		in: 1234567.87,
		expected: '1.234.567,87',
		locale: 'de-DE',
	},
	{
		in: 12345678.87,
		expected: '12.345.678,87',
		locale: 'de-DE',
	},
	{
		in: 123456789.87,
		expected: '123.456.789,87',
		locale: 'de-DE',
	},
];
valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'numberFormat::' + itemToTest.in, function ( assert ) {
		var value = testFunctions.numberFormat( itemToTest.in, itemToTest.locale );
		assert.equal( value, itemToTest.expected, 'Expect numberFormat( \'' + itemToTest.in + ', ' + itemToTest.locale + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test readableLargeNumber.
 */
valuesToTest = [
	{
		in: 123,
		expected: '123'
	},
	{
		in: 1234,
		expected: '1.2K'
	},
	{
		in: 12345,
		expected: '12.3K'
	},
	{
		in: 123456,
		expected: '123K'
	},
	{
		in: 1234567,
		expected: '1.2M'
	},
	{
		in: 12345678,
		expected: '12.3M'
	},
	{
		in: 123456789,
		expected: '123.5M'
	},
];

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'readableLargeNumber::' + itemToTest.in, function ( assert ) {
		var value = testFunctions.readableLargeNumber( itemToTest.in );
		assert.equal( value, itemToTest.expected, 'Expect readableLargeNumber( \'' + itemToTest.in + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test getTimeInSeconds.
 */
valuesToTest = [
	{
		in: 'minute',
		expected: 60
	},
	{
		in: 'hour',
		expected: 60 * 60
	},
	{
		in: 'day',
		expected: 60 * 60 * 24
	},
	{
		in: 'week',
		expected: 60 * 60 * 24 * 7
	},
	{
		in: 'month',
		expected: 60 * 60 * 24 * 30
	},
	{
		in: 'year',
		expected: 60 * 60 * 24 * 365
	},
];
valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'getTimeInSeconds::' + itemToTest.in, function ( assert ) {
		var value = testFunctions.getTimeInSeconds( itemToTest.in );
		assert.equal( value, itemToTest.expected, 'Expect getTimeInSeconds( \'' + itemToTest.in + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test changeToPercent.
 */
valuesToTest = [
	{
		previous: 100,
		current: 110,
		expected: 10.0
	},
	{
		previous: 100,
		current: 90,
		expected: -10.0
	},
	{
		previous: 100,
		current: 121,
		expected: 21.0
	},
	{
		previous: 100,
		current: 101,
		expected: 1.0
	},
	{
		previous: 110,
		current: 111,
		expected: 0.9
	},
	{
		previous: 110,
		current: 115,
		expected: 4.5
	},
	{
		previous: 110,
		current: 121,
		expected: 10.0
	},
	{
		previous: 121,
		current: 110,
		expected: -9.1
	},

];

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'changeToPercent::' + itemToTest.previous + ':' + itemToTest.current + '', function ( assert ) {
		var value = testFunctions.changeToPercent( itemToTest.previous, itemToTest.current );
		assert.equal( value, itemToTest.expected, 'Expect changeToPercent( \'' + itemToTest.previous + ', ' + itemToTest.current + ' \' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test prepareSecondsForDisplay.
 */
valuesToTest = [
	{
		in: 65,
		expected: '1m 5s'
	},
	{
		in: 125,
		expected: '2m 5s'
	},	{
		in: 35,
		expected: '35s'
	},	{
		in: 60,
		expected: '1m'
	},	{
		in: 65,
		expected: '1m 5s'
	},	{
		in: 60 * 60 * 3 + 60 * 5 + 12,
		expected: '3h 5m 12s'
	},	{
		in: 60 * 60 * 7 + 60 * 2 + 42,
		expected: '7h 2m 42s'
	},
];
valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'prepareSecondsForDisplay::' + itemToTest.in, function ( assert ) {
		var value = testFunctions.prepareSecondsForDisplay( itemToTest.in );
		assert.equal( value, itemToTest.expected, 'Expect prepareSecondsForDisplay( \'' + itemToTest.in + '\' ) to return ' + itemToTest.expected );
	} );
} );

/**
 * Test removeURLParameter.
 */
valuesToTest = [
	{
		url: 'https://google.com?message=toast&topping=butter',
		parameter: 'message',
		expected: 'https://google.com/?topping=butter'
	},
	{
		url: 'https://google.com?success=true&message=toast&topping=butter',
		parameter: 'message',
		expected: 'https://google.com/?success=true&topping=butter'
	},
	{
		url: 'https://google.com?message=toast&topping=butter',
		parameter: 'topping',
		expected: 'https://google.com/?message=toast'
	},
	{
		url: 'https://google.com?success=true&message=toast&topping=butter',
		parameter: 'topping',
		expected: 'https://google.com/?success=true&message=toast'
	},
	{
		url: 'https://google.com?success=true&message=toast&topping=butter',
		parameter: 'success',
		expected: 'https://google.com/?message=toast&topping=butter'
	},

];

valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'removeURLParameter::' + itemToTest.url + ':' + itemToTest.parameter + '', function ( assert ) {
		var value = testFunctions.removeURLParameter( itemToTest.url, itemToTest.parameter );

		assert.equal( value, itemToTest.expected, 'Expect removeURLParameter( \'' + itemToTest.url + ', ' + itemToTest.parameter + ' \' ) to return ' + itemToTest.expected );
	} );
} );


/**
 * Test decodeHtmlEntity.
 */
valuesToTest = [
	{
		in: '&quot;Here are some pictures of things we&#039;ve done &amp; enjoyed&quot;',
		expected: '"Here are some pictures of things we\'ve done & enjoyed"'
	},
	{
		in: 'Greater &gt; &#62; and &lt; &#60; less',
		expected: 'Greater > > and < < less'
	},
	{
		in: 'Symbols &#162; &#163; &#8364; &#165; &#169; &#174;',
		expected: 'Symbols ¢ £ € ¥ © ®'
	},
];
valuesToTest.forEach( function( itemToTest ) {
	QUnit.test( 'decodeHtmlEntity::' + itemToTest.in, function ( assert ) {
		var value = testFunctions.decodeHtmlEntity( itemToTest.in );
		assert.equal( value, itemToTest.expected, 'Expect decodeHtmlEntity( \'' + itemToTest.in + '\' ) to return ' + itemToTest.expected );
	} );
} );
