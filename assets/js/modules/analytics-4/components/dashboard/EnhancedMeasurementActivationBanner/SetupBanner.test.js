/**
 * EnhancedMeasurementActivationBanner > SetupBanner component tests.
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
/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	render,
	provideModules,
	provideUserAuthentication,
	fireEvent,
	provideSiteInfo,
	waitFor,
} from '../../../../../../../tests/js/test-utils';
import { mockSurveyEndpoints } from '../../../../../../../tests/js/mock-survey-endpoints';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
} from '../../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY } from '../../../constants';
import SetupBanner from './SetupBanner';

describe( 'SetupBanner', () => {
	const propertyID = '1000';
	const webDataStreamID = '2000';
	const enhancedMeasurementSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/enhanced-measurement-settings'
	);

	let enabledSettingsMock;
	let disabledSettingsMock;
	let registry;

	beforeEach( () => {
		enabledSettingsMock = {
			fileDownloadsEnabled: null,
			name: 'properties/1000/dataStreams/2000/enhancedMeasurementSettings',
			outboundClicksEnabled: null,
			pageChangesEnabled: null,
			scrollsEnabled: null,
			searchQueryParameter: 'q,s,search,query,keyword',
			siteSearchEnabled: null,
			streamEnabled: true,
			uriQueryParameter: null,
			videoEngagementEnabled: null,
		};

		disabledSettingsMock = {
			...enabledSettingsMock,
			streamEnabled: false,
		};

		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID,
			webDataStreamID,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings( disabledSettingsMock, {
				propertyID,
				webDataStreamID,
			} );

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{
				body: JSON.stringify( [
					ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
				] ),
				status: 200,
			}
		);
	} );

	it( 'should render correctly when the user does have the edit scope granted', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		const { container, getByText } = render( <SetupBanner />, {
			registry,
		} );

		await waitFor( () => expect( container ).toMatchSnapshot() );

		await waitFor( () =>
			expect(
				getByText(
					'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required.'
				)
			).toBeInTheDocument()
		);
	} );

	it( 'should render correctly when the user does not have the edit scope granted', () => {
		mockSurveyEndpoints();

		provideSiteInfo( registry, {
			usingProxy: true,
		} );

		const { container, getByText } = render( <SetupBanner />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required — you’ll be redirected to give permission for Site Kit to enable it on your behalf.'
			)
		).toBeInTheDocument();
	} );

	it( 'should enable enhanced measurement when the CTA is clicked and the user has the edit scope granted', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		const onSubmitSuccess = jest.fn();

		const { getByRole, waitForRegistry } = render(
			<SetupBanner onSubmitSuccess={ onSubmitSuccess } />,
			{
				registry,
				features: [ 'enhancedMeasurement' ],
			}
		);

		fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
			status: 200,
			body: { ...enabledSettingsMock },
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
						enhancedMeasurementSettings: enabledSettingsMock,
					},
				},
			}
		);
		expect( onSubmitSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should enable enhanced measurement when the form is auto submitted after the edit scope was granted', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { autoSubmit: true } );

		fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
			status: 200,
			body: { ...enabledSettingsMock },
		} );

		const onSubmitSuccess = jest.fn();

		const { waitForRegistry } = render(
			<SetupBanner onSubmitSuccess={ onSubmitSuccess } />,
			{
				registry,
				features: [ 'enhancedMeasurement' ],
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
						enhancedMeasurementSettings: enabledSettingsMock,
					},
				},
			}
		);
		expect( onSubmitSuccess ).toHaveBeenCalledTimes( 1 );
	} );
} );
