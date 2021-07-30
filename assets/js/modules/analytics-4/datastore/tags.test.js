/**
 * `modules/analytics-4` data store: tags tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import { createTestRegistry, unsubscribeFromAll, untilResolved, provideSiteInfo } from '../../../../../tests/js/utils';

describe( 'modules/analytics tags', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getExistingTag', () => {
			const expectedTag = 'G-1A2BCD345E';
			const tests = {
				'<script></script> tag': `
					<script async src="https://googletagmanager.com/gtag/js?id=${ expectedTag }"></script>
				`,
				'<script /> tag': `
					<script
					 	async
						src="http://www.googletagmanager.com/gtag/js?id=${ expectedTag }"
					/>
				`,
				'__gaTracker( "create", ... ) call': `
					<script>
						__gaTracker ( "create", '${ expectedTag }',"auto");
					</script>
				`,
				'gtag("config", "...") call': `
					<script>
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());
						
						gtag('config', '${ expectedTag }');
					</script>
				`,
				'ga( "create", ... ) call': `
					<script>
						ga(
							"create",
							"${ expectedTag }",
							"auto"
						);
					</script>
				`,
				'_gaq.push( ... ) call': `
					<script>
						var _gaq = _gaq || [];
						_gaq.push(['_setAccount', '${ expectedTag }']);
						_gaq.push(['_trackPageview']);
					</script>
				`,
				'_gaq.push( myTracker... ) call': `
					<script>
						var _gaq = _gaq || [];
						_gaq.push(['myTracker._setAccount', '${ expectedTag }']);
						_gaq.push(['myTracker._setDomainName', 'foo.com']);
						_gaq.push(['myTracker._trackPageview']);
					</script>
				`,
				'<amp-analytics type="gtag"> tag': `
					<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
					<amp-analytics type="gtag" data-credentials="include">
						<script type="application/json">
							{
								"vars" : {
									"gtag_id": "${ expectedTag }",
									"config" : {
									  "G-${ expectedTag }": { "groups": "default" }
									}
								}
							}
						</script>
					</amp-analytics>
				`,
				'<amp-analytics type="googleanalytics"> tag': `
					<amp-analytics type="googleanalytics" config="https://example.com/analytics.account.config.json">
						<script type="application/json">
							{
								"vars": {
									"account": "${ expectedTag }"
								}
							}
						</script>
					</amp-analytics>
				`,
			};

			it.each( Object.entries( tests ) )( 'should correctly find GA4 measurement ID in the %s', async ( _, body ) => {
				fetchMock.getOnce( { query: { tagverify: '1' } }, {
					body: `
						<html>
							<head></head>
							<body>${ body }</body>
						</html>
					`,
				} );

				registry.select( STORE_NAME ).getExistingTag();
				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( registry.select( STORE_NAME ).getExistingTag() ).toEqual( expectedTag );
			} );
		} );
	} );
} );
