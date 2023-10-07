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
} from '../../../../../../../tests/js/test-utils';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { EDIT_SCOPE } from '../../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY } from '../../../constants';
import EnhancedMeasurementActivationBanner from './index';

describe( 'EnhancedMeasurementActivationBanner', () => {
	const propertyID = '1000';
	const webDataStreamID = '2000';

	let enhancedMeasurementSettingsMock;
	let registry;

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

		registry = createTestRegistry();

		provideUserInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID,
			webDataStreamID,
			ownerID: 1,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				enhancedMeasurementSettingsMock,
				{ propertyID, webDataStreamID }
			);
	} );

	it( 'should render the setup step when enhanced measurement is initially false and the banner is not dismissed', () => {
		const { container, getByRole } = render(
			<EnhancedMeasurementActivationBanner />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByRole( 'button', { name: 'Enable now' } )
		).toBeInTheDocument();
	} );

	it( 'should render the success step when the the setup form is successfully submitted', async () => {
		const { container, getByRole, getByText, waitForRegistry } = render(
			<EnhancedMeasurementActivationBanner />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Enable now' } ) );

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'You successfully enabled enhanced measurement for your site'
			)
		).toBeInTheDocument();
	} );

	it.each( [
		[
			'there is not a valid propertyID',
			() => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: '',
				} );
			},
		],
		[
			'there is not a valid webDataStreamID',
			() => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					webDataStreamID: '',
				} );
			},
		],
		[
			'the user does not have access to the Analytics 4 module',
			() => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					ownerID: 2,
				} );

				registry
					.dispatch( CORE_MODULES )
					.receiveCheckModuleAccess(
						{ access: false },
						{ slug: 'analytics-4' }
					);
			},
		],
		[
			'enhanced measurement is initially true',
			() => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{
							...enhancedMeasurementSettingsMock,
							streamEnabled: true,
						},
						{ propertyID, webDataStreamID }
					);
			},
		],
		[
			'the banner is dismissed',
			() => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
					] );
			},
		],
	] )( 'should not render when %s', ( _, setupTestCase ) => {
		setupTestCase();

		const { container } = render( <EnhancedMeasurementActivationBanner />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
