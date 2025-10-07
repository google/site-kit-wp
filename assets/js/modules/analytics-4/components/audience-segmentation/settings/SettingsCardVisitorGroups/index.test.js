/**
 * SettingsCardVisitorGroups component tests.
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
import { render, waitFor } from '../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideUserAuthentication,
} from '../../../../../../../../tests/js/utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION } from './SetupSuccess';
import SettingsCardVisitorGroups from './';

const mockTrackEvent = vi.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SettingsCardVisitorGroups', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should render the setup CTA if groups are not configured', () => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			audienceSegmentationSetupCompletedBy: null,
		} );

		const { getByRole } = render( <SettingsCardVisitorGroups />, {
			registry,
		} );

		expect(
			getByRole( 'button', { name: /Enable groups/i } )
		).toBeInTheDocument();
	} );

	it( 'should render the setup success notification once groups are configured', async () => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'audienceA', 'audienceB' ],
			isAudienceSegmentationWidgetHidden: false,
		} );
		const userID = registry.select( CORE_USER ).getID();
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAudienceSegmentationSetupCompletedBy( userID + 1 );

		registry
			.dispatch( CORE_UI )
			.setValue(
				SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION,
				true
			);

		const { getByText, waitForRegistry } = render(
			<SettingsCardVisitorGroups />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText(
				'We’ve added the visitor groups section to your dashboard!'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the visitor groups switch correctly', async () => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'audienceA', 'audienceB' ],
			isAudienceSegmentationWidgetHidden: false,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			audienceSegmentationSetupCompletedBy: null,
		} );

		const { getByLabelText } = render( <SettingsCardVisitorGroups />, {
			registry,
		} );

		const switchControl = getByLabelText(
			'Display visitor groups in dashboard'
		);

		await waitFor( () => {
			expect( switchControl ).toBeChecked();
		} );
	} );

	describe( 'the "Display visitor groups in dashboard" switch', () => {
		const audienceSettingsEndpoint = new RegExp(
			'/google-site-kit/v1/core/user/data/audience-settings'
		);

		beforeEach( () => {
			const availableAudiences = [
				{
					name: 'audienceA',
					description: 'Audience A',
					displayName: 'Audience A',
					audienceType: 'DEFAULT_AUDIENCE',
					audienceSlug: 'audience-a',
				},
				{
					name: 'audienceB',
					description: 'Audience B',
					displayName: 'Audience B',
					audienceType: 'SITE_KIT_AUDIENCE',
					audienceSlug: 'audience-b',
				},
			];

			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: [ 'audienceA', 'audienceB' ],
				isAudienceSegmentationWidgetHidden: true,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetAudienceSettings( {
					availableAudiences,
					audienceSegmentationSetupCompletedBy: null,
				} );

			fetchMock.post( audienceSettingsEndpoint, ( url, opts ) => {
				const { data } = JSON.parse( opts.body );
				// Return the same settings passed to the API.
				return { body: data, status: 200 };
			} );
		} );

		it( 'should toggle on click and save the audience settings', async () => {
			const { getByLabelText, waitForRegistry } = render(
				<SettingsCardVisitorGroups />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SETTINGS,
				}
			);

			await waitForRegistry();

			const switchControl = getByLabelText(
				'Display visitor groups in dashboard'
			);

			expect( switchControl ).not.toBeChecked();

			switchControl.click();

			await waitFor( () => {
				expect( switchControl ).toBeChecked();

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( audienceSettingsEndpoint, {
					body: {
						data: {
							settings: {
								configuredAudiences: [
									'audienceA',
									'audienceB',
								],
								isAudienceSegmentationWidgetHidden: false,
							},
						},
					},
				} );
			} );
		} );

		it( 'should track an event when toggled', async () => {
			const { getByLabelText, waitForRegistry } = render(
				<SettingsCardVisitorGroups />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SETTINGS,
				}
			);

			await waitForRegistry();

			const switchControl = getByLabelText(
				'Display visitor groups in dashboard'
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			switchControl.click();

			await waitFor( () => {
				expect( switchControl ).toBeChecked();
				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'settings_audiences-settings',
					'audience_widgets_enable'
				);
			} );

			await waitForRegistry();

			switchControl.click();

			await waitForRegistry();

			await waitFor( () => {
				expect( switchControl ).not.toBeChecked();
				expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'settings_audiences-settings',
					'audience_widgets_disable'
				);
			} );
		} );
	} );
} );
