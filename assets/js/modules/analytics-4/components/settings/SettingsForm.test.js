/**
 * Analytics 4 SettingsForm component tests.
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
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import SettingsForm from './SettingsForm';

jest.mock( './SettingsControls', () => () => null );
jest.mock( './SettingsEnhancedMeasurementSwitch', () => () => null );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SettingsForm', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
			enabled: false,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: null,
		} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should not track the learn more link when setupFlowRefresh is disabled', () => {
		const { getByRole } = render( <SettingsForm />, {
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		const link = getByRole( 'link', {
			name: /learn more/i,
		} );

		fireEvent.click( link );

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should track the learn more link when setupFlowRefresh is enabled', () => {
		const { getByRole } = render( <SettingsForm />, {
			features: [ 'setupFlowRefresh' ],
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		const link = getByRole( 'link', {
			name: /learn more/i,
		} );

		fireEvent.click( link );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			VIEW_CONTEXT_SETTINGS,
			'click_learn_more_link',
			'plugin_conversion_tracking'
		);
	} );
} );
