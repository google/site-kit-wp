/**
 * EnhancedMeasurementActivationBanner component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
	render,
	provideModules,
	provideModuleRegistrations,
	provideUserInfo,
	provideUserAuthentication,
	fireEvent,
	waitFor,
	waitForElementToBeRemoved,
	freezeFetch,
} from '../../../../../../../tests/js/test-utils';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import * as analytics4Fixtures from '../../../datastore/__fixtures__';
import EnhancedMeasurementActivationBanner from './index';
import { properties } from '../../../datastore/__fixtures__';
import {
	getViewportWidth,
	setViewportWidth,
} from '../../../../../../../tests/js/viewport-width-utils';
import { withNotificationComponentProps } from '../../../../../googlesitekit/notifications/util/component-props';
import { ANALYTICS_4_NOTIFICATIONS } from '../../..';
import { CORE_NOTIFICATIONS } from '../../../../../googlesitekit/notifications/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../googlesitekit/constants';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import {
	MODULE_SLUG_ANALYTICS_4,
	LEGACY_ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
} from '../../../constants';

describe( 'EnhancedMeasurementActivationBanner', () => {
	const EnhancedMeasurementActivationBannerComponent =
		withNotificationComponentProps( 'enhanced-measurement-notification' )(
			EnhancedMeasurementActivationBanner
		);

	const notification =
		ANALYTICS_4_NOTIFICATIONS[ 'enhanced-measurement-notification' ];

	const propertyID = '1000';
	const webDataStreamID = '2000';

	const enhancedMeasurementSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/enhanced-measurement-settings'
	);

	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	let enhancedMeasurementSettingsMock;
	let enhancedMeasurementEnabledSettingsMock;
	let registry;
	let originalViewportWidth;

	beforeEach( () => {
		enhancedMeasurementSettingsMock = {
			fileDownloadsEnabled: null,
			name: 'properties/1000/dataStreams/2000/enhancedMeasurementSettings',
			outboundClicksEnabled: null,
			pageChangesEnabled: null,
			scrollsEnabled: null,
			searchQueryParameter: 'q,s,search,query,keyword',
			siteSearchEnabled: null,
			streamEnabled: false,
			uriQueryParameter: null,
			videoEngagementEnabled: null,
		};

		enhancedMeasurementEnabledSettingsMock = {
			...enhancedMeasurementSettingsMock,
			streamEnabled: true,
		};

		registry = createTestRegistry();

		provideUserInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				'enhanced-measurement-notification',
				notification
			);

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID,
			webDataStreamID,
			ownerID: 1,
			propertyCreateTime: 1662715085968,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( properties[ 0 ], { propertyID } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				enhancedMeasurementSettingsMock,
				{ propertyID, webDataStreamID }
			);

		originalViewportWidth = getViewportWidth();
		setViewportWidth( 450 );
	} );

	afterEach( () => {
		setViewportWidth( originalViewportWidth );
	} );

	it( 'should render the setup step when enhanced measurement is initially false and the banner is not dismissed', async () => {
		const { container, getByRole } = render(
			<EnhancedMeasurementActivationBannerComponent />,
			{
				registry,
			}
		);

		await waitFor( () => expect( container ).toMatchSnapshot() );

		await waitFor( () =>
			expect(
				getByRole( 'button', { name: 'Enable now' } )
			).toBeInTheDocument()
		);
	} );

	it( 'should render the in progress step when enhanced measurement is being enabled after the user returns from the OAuth flow', async () => {
		freezeFetch( enhancedMeasurementSettingsEndpoint );

		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { autoSubmit: true } );

		const { container, waitForRegistry } = render(
			<EnhancedMeasurementActivationBannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		await waitFor( () => expect( container ).toMatchSnapshot() );
	} );

	it( 'should render the success step when the the setup form is successfully submitted', async () => {
		fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
			status: 200,
			body: analytics4Fixtures.defaultEnhancedMeasurementSettings,
		} );

		const { container, getByRole, getByText, waitForRegistry } = render(
			<EnhancedMeasurementActivationBannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const enableNowButton = getByRole( 'button', { name: 'Enable now' } );
		fireEvent.click( enableNowButton );

		await waitForElementToBeRemoved( enableNowButton );

		await waitForRegistry();

		// Enhanced measurement settings should update when enhanced measurement
		// is enabled via the "Enable now" CTA.
		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		expect( fetchMock ).toHaveFetched(
			enhancedMeasurementSettingsEndpoint
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'You successfully enabled enhanced measurement for your site'
			)
		).toBeInTheDocument();
	} );

	it( 'should enable enhanced measurement when the CTA in SetupBanner is clicked and the user has the edit scope granted', async () => {
		const { getByRole, waitForRegistry } = render(
			<EnhancedMeasurementActivationBannerComponent />,
			{
				registry,
			}
		);

		fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
			status: 200,
			body: { ...enhancedMeasurementEnabledSettingsMock },
		} );

		fetchMock.postOnce( fetchDismissItem, {
			status: 200,
			body: [],
		} );

		fireEvent.click( getByRole( 'button', { name: 'Enable now' } ) );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched(
			enhancedMeasurementSettingsEndpoint,
			{
				body: {
					data: {
						propertyID,
						webDataStreamID,
						enhancedMeasurementSettings:
							enhancedMeasurementEnabledSettingsMock,
					},
				},
			}
		);
	} );

	it( 'should enable enhanced measurement when the form is auto submitted after the edit scope was granted', async () => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { autoSubmit: true } );

		fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
			status: 200,
			body: { ...enhancedMeasurementEnabledSettingsMock },
		} );

		const { waitForRegistry } = render(
			<EnhancedMeasurementActivationBannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched(
			enhancedMeasurementSettingsEndpoint,
			{
				body: {
					data: {
						propertyID,
						webDataStreamID,
						enhancedMeasurementSettings:
							enhancedMeasurementEnabledSettingsMock,
					},
				},
			}
		);
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when Enhanced Measurement is not enabled', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when user has dismissed using the legacy dismissed items', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					LEGACY_ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
				] );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the propertyID is invalid', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
				propertyID: '',
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the webDataStreamID is invalid', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
				webDataStreamID: '',
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the user does not have access to the Analytics 4 module', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
				ownerID: 2,
			} );

			registry
				.dispatch( CORE_MODULES )
				.receiveCheckModuleAccess(
					{ access: false },
					{ slug: MODULE_SLUG_ANALYTICS_4 }
				);

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active enhanced measurement is initially true', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetEnhancedMeasurementSettings(
					{
						...enhancedMeasurementSettingsMock,
						streamEnabled: true,
					},
					{ propertyID, webDataStreamID }
				);

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );
	} );
} );
