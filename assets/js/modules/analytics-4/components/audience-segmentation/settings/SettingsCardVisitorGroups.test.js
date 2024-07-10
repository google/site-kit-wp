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

import { render, waitFor } from '../../../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import SettingsCardVisitorGroups from './SettingsCardVisitorGroups';

describe( 'SettingsCardVisitorGroups', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should render the visitor groups switch correctly', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'audienceA', 'audienceB' ],
			isAudienceSegmentationWidgetHidden: false,
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

	it( 'should toggle the switch on click and save the audience settings', async () => {
		const audienceSettingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
		);

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

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'audienceA', 'audienceB' ],
			isAudienceSegmentationWidgetHidden: true,
		} );

		fetchMock.postOnce( audienceSettingsEndpoint, {
			body: {
				configuredAudiences: [ 'audienceA', 'audienceB' ],
				isAudienceSegmentationWidgetHidden: false,
			},
			status: 200,
		} );

		const { getByLabelText } = render( <SettingsCardVisitorGroups />, {
			registry,
		} );

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
							configuredAudiences: [ 'audienceB', 'audienceA' ],
							isAudienceSegmentationWidgetHidden: false,
						},
					},
				},
			} );
		} );
	} );
} );
