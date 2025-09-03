/**
 * GoogleTagIDMismatchNotification component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import {
	render,
	createTestRegistry,
	provideUserInfo,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';
import GoogleTagIDMismatchNotification from './GoogleTagIDMismatchNotification';
import {
	GTM_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { ANALYTICS_4_NOTIFICATIONS } from '@/js/modules/analytics-4';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import * as fixtures from '@/js/modules/analytics-4/datastore/__fixtures__';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';

describe( 'GoogleTagIDMismatchNotification', () => {
	let registry;
	const GoogleTagIDMismatchNotificationComponent =
		withNotificationComponentProps( 'google-tag-id-mismatch' )(
			GoogleTagIDMismatchNotification
		);

	const notification = ANALYTICS_4_NOTIFICATIONS[ 'google-tag-id-mismatch' ];

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ GTM_SCOPE ],
		} );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: MODULE_SLUG_ANALYTICS_4,
			},
		] );

		const currentMeasurementID = 'G-2B7M8YQ1K6';

		const currentAnalyticsSettingsMock = {
			ownerID: 1,
			propertyID: '1000',
			webDataStreamID: '2000',
			measurementID: currentMeasurementID,
			useSnippet: true,
			googleTagID: 'GT-123',
			googleTagLastSyncedAtMs: 0,
		};
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setSettings( currentAnalyticsSettingsMock );
		const property = fixtures.properties[ 0 ];
		const propertyID = property._id;
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( property, { propertyID } );

		const containerMock = fixtures.container[ currentMeasurementID ];
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetGoogleTagContainer( containerMock, {
				measurementID: currentMeasurementID,
			} );

		const newAnalyticsPropertyID = '1122334455';
		const accountSummaries = [
			{
				account: 'accounts/123456',
				name: 'accountSummaries/987654321',
				propertySummaries: [
					{
						property: `properties/${ newAnalyticsPropertyID }`,
						_id: newAnalyticsPropertyID,
					},
				],
				_id: '123456',
			},
		];

		const propertyIDs = accountSummaries
			.map( ( { propertySummaries } ) =>
				propertySummaries.map( ( { _id } ) => _id )
			)
			.reduce( ( acc, propIDs ) => [ ...acc, ...propIDs ], [] );

		const datastreams = {
			[ newAnalyticsPropertyID ]: [
				{
					_id: '110',
					webStreamData: {
						defaultUri: 'http://example-1.test', // eslint-disable-line sitekit/acronym-case
						measurementId: currentMeasurementID, // eslint-disable-line sitekit/acronym-case
					},
				},
			],
		};
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries( {
			accountSummaries,
			nextPageToken: null,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreamsBatch( datastreams, {
				propertyIDs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getWebDataStreamsBatch', [ propertyIDs ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( fixtures.properties[ 1 ], {
				propertyID: newAnalyticsPropertyID,
			} );
	} );

	it( 'should render the "alternative GA4 Config found" notification variation', async () => {
		const gtmAccountID = '6065484567';
		const gtmContainerID = '98369876';
		const containerDestinationsMock =
			fixtures.containerDestinations[ gtmAccountID ][ gtmContainerID ];

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setGoogleTagAccountID( gtmAccountID );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setGoogleTagContainerID( gtmContainerID );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetGoogleTagContainerDestinations(
				containerDestinationsMock,
				{
					gtmAccountID,
					gtmContainerID,
				}
			);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveHasMismatchGoogleTagID( true );

		const { container, waitForRegistry } = render(
			<GoogleTagIDMismatchNotificationComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the "alternative GA4 Config not found" notification variation', async () => {
		const gtmAccountID = '6065484567';
		const gtmContainerID = '98369876';

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setGoogleTagAccountID( gtmAccountID );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setGoogleTagContainerID( gtmContainerID );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetGoogleTagContainerDestinations( [], {
				gtmAccountID,
				gtmContainerID,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveHasMismatchGoogleTagID( true );

		const { container, waitForRegistry } = render(
			<GoogleTagIDMismatchNotificationComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when all conditions are met', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveHasMismatchGoogleTagID( true );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when analytics-4 is not connected', async () => {
			provideModules( registry, [
				{
					active: false,
					connected: false,
					slug: MODULE_SLUG_ANALYTICS_4,
				},
			] );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveHasMismatchGoogleTagID( true );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when current logged in user is not analytics-4 module owner', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setSettings( { ownerID: 2 } );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveHasMismatchGoogleTagID( true );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when user does not have GTM scope', async () => {
			provideUserAuthentication( registry );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveHasMismatchGoogleTagID( true );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when mismatched Google Tag ID is false', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveHasMismatchGoogleTagID( false );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );
	} );
} );
