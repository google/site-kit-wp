/**
 * SettingsAdmin component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	provideModules,
	render,
} from '@tests/js/test-utils';
import SettingsAdmin from './SettingsAdmin';

jest.mock(
	'@/js/modules/analytics-4/components/audience-segmentation/settings/SettingsCardAudiences',
	() => {
		const {
			mockCreateComponent,
		} = require( '@tests/js/mock-component-utils' );
		return mockCreateComponent( 'SettingsCardAudiences' );
	}
);

describe( 'SettingsAdmin', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		fetchMock.get( /\/google-site-kit\/v1\//, {
			body: {},
			status: 200,
		} );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: false,
			},
		] );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'audienceA' ],
			isAudienceSegmentationWidgetHidden: true,
			didSetAudiences: true,
		} );
	} );

	it( 'should render SettingsCardAudiences when setupFlowRefresh is disabled', async () => {
		const { getByText, waitForRegistry } = render( <SettingsAdmin />, {
			registry,
		} );

		await waitForRegistry();

		expect( getByText( /SettingsCardAudiences/i ) ).toBeInTheDocument();
	} );

	it( 'should not render SettingsCardAudiences when setupFlowRefresh is enabled', async () => {
		const { queryByText, waitForRegistry } = render( <SettingsAdmin />, {
			registry,
			features: [ 'setupFlowRefresh' ],
		} );

		await waitForRegistry();

		expect(
			queryByText( /SettingsCardAudiences/i )
		).not.toBeInTheDocument();
	} );
} );
