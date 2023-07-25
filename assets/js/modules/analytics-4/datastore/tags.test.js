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
import {
	createTestRegistry,
	unsubscribeFromAll,
	untilResolved,
	provideSiteInfo,
} from '../../../../../tests/js/utils';
import API from 'googlesitekit-api';
import { MODULES_ANALYTICS_4 } from './constants';
import * as fixtures from './__fixtures__';

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
			const expectedTag = 'G-2B7M8YQ1K6';
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

			it.each( Object.entries( tests ) )(
				'should correctly find GA4 measurement ID in the %s',
				async ( _, body ) => {
					fetchMock.getOnce(
						{ query: { tagverify: '1' } },
						{
							body: `
						<html>
							<head></head>
							<body>${ body }</body>
						</html>
					`,
						}
					);

					const containerMock = fixtures.container[ expectedTag ];
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetGoogleTagContainer( containerMock, {
							measurementID: expectedTag,
						} );

					registry.select( MODULES_ANALYTICS_4 ).getExistingTag();
					await untilResolved(
						registry,
						MODULES_ANALYTICS_4
					).getExistingTag();

					expect(
						registry.select( MODULES_ANALYTICS_4 ).getExistingTag()
					).toEqual( expectedTag );
				}
			);

			describe( 'GTE support', () => {
				const containerLookupEndpoint = new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/container-lookup'
				);
				const containerMock = fixtures.container[ expectedTag ];

				it( 'should return null if no tag is found on the page', async () => {
					fetchMock.getOnce(
						{ query: { tagverify: '1' } },
						{
							body: `
						<html>
							<head></head>
							<body></body>
						</html>
					`,
						}
					);

					const initialExistingTag = registry
						.select( MODULES_ANALYTICS_4 )
						.getExistingTag();
					expect( initialExistingTag ).toBeUndefined();

					await untilResolved(
						registry,
						MODULES_ANALYTICS_4
					).getExistingTag();

					const existingTag = registry
						.select( MODULES_ANALYTICS_4 )
						.getExistingTag();

					expect( fetchMock ).toHaveFetchedTimes( 1 );
					expect( existingTag ).toBeNull();
				} );

				describe.each( Object.entries( tests ) )(
					'when %s is present',
					( _, body ) => {
						beforeEach( () => {
							fetchMock.getOnce(
								{ query: { tagverify: '1' } },
								{
									body: `
								<html>
									<head></head>
									<body>${ body }</body>
								</html>
							`,
								}
							);
						} );

						it( 'uses a resolver to get the tag', async () => {
							fetchMock.getOnce( containerLookupEndpoint, {
								body: containerMock,
								status: 200,
							} );

							const initialExistingTag = registry
								.select( MODULES_ANALYTICS_4 )
								.getExistingTag();
							expect( initialExistingTag ).toBeUndefined();

							await untilResolved(
								registry,
								MODULES_ANALYTICS_4
							).getExistingTag();

							const existingTag = registry
								.select( MODULES_ANALYTICS_4 )
								.getExistingTag();

							expect( fetchMock ).toHaveFetchedTimes( 2 );
							expect( existingTag ).toBe( expectedTag );
						} );

						it( 'should return null if no container is found', async () => {
							fetchMock.getOnce( containerLookupEndpoint, {
								body: {
									code: 404,
									message: 'Not found or permission denied.',
									data: { status: 404, reason: 'notFound' },
								},
								status: 404,
							} );

							const initialExistingTag = registry
								.select( MODULES_ANALYTICS_4 )
								.getExistingTag();
							expect( initialExistingTag ).toBeUndefined();

							await untilResolved(
								registry,
								MODULES_ANALYTICS_4
							).getExistingTag();

							const existingTag = registry
								.select( MODULES_ANALYTICS_4 )
								.getExistingTag();

							expect( fetchMock ).toHaveFetchedTimes( 2 );
							expect( existingTag ).toBeNull();
							expect( console ).toHaveErrored();
						} );

						it( 'should return null if the container does not contain the tag ID', async () => {
							fetchMock.getOnce( containerLookupEndpoint, {
								body: {
									...containerMock,
									tagIds: [ 'G-1234567890' ],
								},
								status: 200,
							} );

							const initialExistingTag = registry
								.select( MODULES_ANALYTICS_4 )
								.getExistingTag();
							expect( initialExistingTag ).toBeUndefined();

							await untilResolved(
								registry,
								MODULES_ANALYTICS_4
							).getExistingTag();

							const existingTag = registry
								.select( MODULES_ANALYTICS_4 )
								.getExistingTag();

							expect( fetchMock ).toHaveFetchedTimes( 2 );
							expect( existingTag ).toBeNull();
						} );
					}
				);
			} );
		} );
	} );
} );
