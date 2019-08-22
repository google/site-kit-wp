/**
 * Internal dependencies
 */
import { getReAuthUrl } from '../';

const valuesToTest = [
	[
		'pagespeed-insights',
		false,
		false,
		'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard&reAuth=false&slug=pagespeed-insights'
	],
	[
		'pagespeed-insights',
		true,
		false,
		'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-module-pagespeed-insights&reAuth=false&slug=pagespeed-insights'
	],
	[
		'pagespeed-insights',
		false,
		'abc123',
		'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-dashboard&reAuth=false&slug=pagespeed-insights'
	],
	[
		'pagespeed-insights',
		true,
		'abc123',
		'http://sitekit.withgoogle.com/wp-admin/admin.php?page=googlesitekit-module-pagespeed-insights&reAuth=false&slug=pagespeed-insights'
	]
];

describe( 'getReAuthUrl', () => {
	it.each( valuesToTest )( 'given slug s, status %p, and apikey %s, should return %s', ( slug, status, apikey, expected ) => {
		expect( getReAuthUrl( slug, status ) ).toStrictEqual( expected );
	} );
} );


