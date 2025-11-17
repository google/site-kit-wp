/**
 * AccountCreate component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	cleanup,
	createTestRegistry,
	fireEvent,
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
} from '../../../../../../../tests/js/test-utils';
import { mockLocation } from '../../../../../../../tests/js/mock-browser-utils';
import { mockUseInstanceID } from '../../../../../../../tests/js/mock-use-instance-id';

import {
	EDIT_SCOPE,
	GTM_SCOPE,
	MODULES_ANALYTICS_4,
	PROVISIONING_SCOPE,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { createCacheKey } from '@/js/googlesitekit/api';
import { getKeys, setItem } from '@/js/googlesitekit/api/cache';
import AccountCreate from '.';
import * as tracking from '@/js/util/tracking';
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';

const REGEX_REST_CONVERSION_TRACKING_SETTINGS = new RegExp(
	'^/google-site-kit/v1/core/site/data/conversion-tracking'
);

describe( 'AccountCreate', () => {
	mockLocation();
	// Provide our own version of the `useInstanceId()` hook to avoid instability in test snapshots.
	mockUseInstanceID();

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE, PROVISIONING_SCOPE, GTM_SCOPE ],
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries( {
			accountSummaries: [],
			nextPageToken: null,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getAccountSummaries', [] );

		// Enable Plugin Conversion Tracking by default to avoid adding
		// the notice in existing cases.
		registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
			enabled: true,
		} );
	} );

	it( 'renders correctly in a loading state', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.invalidateResolution( 'getAccountSummaries', [] );

		const { container, getByRole, waitForRegistry } = render(
			<AccountCreate />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();
	} );

	it( 'renders correctly when data has loaded', async () => {
		const { container, getByRole, waitForRegistry } = render(
			<AccountCreate />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByRole( 'button', { name: 'Create Account' } )
		).toBeInTheDocument();
	} );

	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	describe( 'when clicking on Create Account', () => {
		const accountTicketID = 'abc123';

		let getByRole, waitForRegistry, rerender;

		beforeEach( () => {
			( { getByRole, waitForRegistry, rerender } = render(
				<AccountCreate />,
				{
					registry,
				}
			) );

			fetchMock.post(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/create-account-ticket'
				),
				{
					// eslint-disable-next-line sitekit/acronym-case
					body: { accountTicketId: accountTicketID },
					status: 200,
				}
			);
			muteFetch( REGEX_REST_CONVERSION_TRACKING_SETTINGS );
		} );

		it( 'should invalidate the module cache', async () => {
			await setItem(
				createCacheKey(
					'modules',
					MODULE_SLUG_ANALYTICS_4,
					'analytics-datapoint'
				),
				'analytics-value'
			);

			const searchConsoleItemCacheKey = createCacheKey(
				'modules',
				MODULE_SLUG_SEARCH_CONSOLE,
				'search-console-datapoint'
			);

			await setItem( searchConsoleItemCacheKey, 'search-console-value' );

			await expect( getKeys() ).resolves.toHaveLength( 2 );

			fireEvent.click(
				getByRole( 'button', { name: 'Create Account' } )
			);

			await waitForRegistry();

			// Verify the cache is cleared for the `analytics-4` module.
			const cacheKeys = await getKeys();
			expect( cacheKeys ).toHaveLength( 1 );
			expect( cacheKeys[ 0 ] ).toContain( searchConsoleItemCacheKey );
		} );

		it( 'should make a request to the `create-account-ticket` endpoint when clicking the Create Account button', async () => {
			rerender( <AccountCreate /> );

			fireEvent.click(
				getByRole( 'button', { name: 'Create Account' } )
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/create-account-ticket'
				),
				{
					body: {
						data: {
							displayName: 'My Site Name',
							propertyName: 'example.com',
							dataStreamName: 'example.com',
							timezone: 'America/Detroit',
							regionCode: 'US',
							enhancedMeasurementStreamEnabled: true,
							showProgress: false, // `showProgress` defaults to false when not present as a query parameter.
						},
					},
				}
			);
		} );

		it( 'should set the `showProgress` property to `true` in the `create-account-ticket` request when the `showProgress` query parameter is "true"', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&showProgress=true';

			rerender( <AccountCreate /> );

			fireEvent.click(
				getByRole( 'button', { name: 'Create Account' } )
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/create-account-ticket'
				),
				{
					body: {
						data: {
							displayName: 'My Site Name',
							propertyName: 'example.com',
							dataStreamName: 'example.com',
							timezone: 'America/Detroit',
							regionCode: 'US',
							enhancedMeasurementStreamEnabled: true,
							showProgress: true,
						},
					},
				}
			);
		} );

		it.each( [ [ 'false' ], [ '0' ] ] )(
			'should set the `showProgress` property to `false` in the `create-account-ticket` request when the `showProgress` query parameter is "%s"',
			async ( showProgress ) => {
				global.location.href = `http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&showProgress=${ showProgress }`;

				rerender( <AccountCreate /> );

				fireEvent.click(
					getByRole( 'button', { name: 'Create Account' } )
				);

				await waitForRegistry();

				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/create-account-ticket'
					),
					{
						body: {
							data: {
								displayName: 'My Site Name',
								propertyName: 'example.com',
								dataStreamName: 'example.com',
								timezone: 'America/Detroit',
								regionCode: 'US',
								enhancedMeasurementStreamEnabled: true,
								showProgress: false,
							},
						},
					}
				);
			}
		);

		it( 'should navigate to the Google Analytics Terms of Service', async () => {
			fireEvent.click(
				getByRole( 'button', { name: 'Create Account' } )
			);

			await waitForRegistry();

			const accountTicketTermsOfServiceURL = registry
				.select( MODULES_ANALYTICS_4 )
				.getAccountTicketTermsOfServiceURL();

			// Verify that the URL has been navigated to.
			expect( global.location.assign ).toHaveBeenCalledWith(
				accountTicketTermsOfServiceURL
			);

			// Sanity check that the URL is correct.
			expect( accountTicketTermsOfServiceURL ).toMatch(
				new RegExp(
					`analytics.google.com.*termsofservice.*${ accountTicketID }`
				)
			);
		} );

		it( 'should enable conversion tracking', async () => {
			fireEvent.click(
				getByRole( 'button', { name: 'Create Account' } )
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched(
				REGEX_REST_CONVERSION_TRACKING_SETTINGS
			);
		} );

		describe( 'event tracking', () => {
			beforeEach( () => {
				mockTrackEvent.mockClear();
				cleanup();
			} );

			it( 'should track initial setup flow create account event when showProgress=true', async () => {
				global.location.href =
					'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&showProgress=true';

				( { getByRole, waitForRegistry, rerender } = render(
					<AccountCreate />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MODULE_SETUP,
						features: [ 'setupFlowRefresh' ],
					}
				) );

				fireEvent.click(
					getByRole( 'button', { name: 'Create Account' } )
				);

				await waitForRegistry();

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MODULE_SETUP }_setup`,
					'setup_flow_v3_create_analytics_account'
				);

				const genericCreateAccountCall = mockTrackEvent.mock.calls.find(
					( call ) =>
						call[ 0 ]?.endsWith( '_analytics' ) &&
						call[ 1 ] === 'create_account'
				);
				expect( genericCreateAccountCall ).toBeUndefined();
			} );

			it( 'should track generic create account event when showProgress is not true', async () => {
				global.location.href =
					'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true';
				( { getByRole, waitForRegistry, rerender } = render(
					<AccountCreate />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MODULE_SETUP,
					}
				) );

				fireEvent.click(
					getByRole( 'button', { name: 'Create Account' } )
				);

				await waitForRegistry();

				const genericCreateAccountCall = mockTrackEvent.mock.calls.find(
					( call ) =>
						call[ 0 ]?.endsWith( '_analytics' ) &&
						call[ 1 ] === 'create_account' &&
						call[ 2 ] === 'proxy'
				);
				expect( genericCreateAccountCall ).toBeDefined();

				const initialSetupCall = mockTrackEvent.mock.calls.find(
					( call ) =>
						call[ 0 ] === `${ VIEW_CONTEXT_MODULE_SETUP }_setup` &&
						call[ 1 ] === 'setup_flow_v3_create_analytics_account'
				);
				expect( initialSetupCall ).toBeUndefined();
			} );
		} );
	} );
} );
