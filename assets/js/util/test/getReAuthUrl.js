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

// Disable reason: Needs investigation.
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'getReAuthUrl', () => {
	it.each( valuesToTest )( 'should return URL for slug %s, status %p, and API key %s', ( slug, status, apikey, expected ) => {
		// eslint-disable-next-line no-undef
		global.googlesitekit.admin.apikey = apikey;
		expect( getReAuthUrl( slug, status ) ).toStrictEqual( expected );
	} );
} );


