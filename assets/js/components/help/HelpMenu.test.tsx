/**
 * HelpMenu component tests.
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
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	render,
} from '../../../../tests/js/test-utils';
import { type WPDataRegistry } from '@/js/googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
} from '@/js/googlesitekit/datastore/user/constants';
import HelpMenu from './HelpMenu';
import * as tours from '@/js/feature-tours/welcome';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';

const welcomeTourMock = {
	slug: 'mocked-tour',
	isRepeatable: true,
	contexts: [],
	gaEventCategory: () => '',
	step: '',
	steps: [],
};
const getWelcomeTourMock = jest.spyOn( tours, 'getWelcomeTour' );
getWelcomeTourMock.mockImplementation( () => welcomeTourMock );

describe( 'HelpMenu', () => {
	let registry: WPDataRegistry;
	let triggerOnDemandTourSpy: jest.SpyInstance;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {
			[ PERMISSION_AUTHENTICATE ]: true,
		} );
		triggerOnDemandTourSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'triggerOnDemandTour'
		);
	} );

	it( 'should trigger an on-demand tour when clicking on "Start a feature tour"', () => {
		const { getByRole } = render( <HelpMenu />, {
			registry,
			features: [ 'setupFlowRefresh' ],
		} );

		act( () => {
			fireEvent.click( getByRole( 'button', { name: 'Help' } ) );
		} );

		act( () => {
			fireEvent.click(
				getByRole( 'menuitem', { name: 'Start a feature tour' } )
			);
		} );

		expect( getWelcomeTourMock ).toHaveBeenCalledWith( {
			canAuthenticate: true,
			isAnalyticsConnected: true,
			isViewOnly: false,
		} );

		expect( triggerOnDemandTourSpy ).toHaveBeenCalledWith(
			welcomeTourMock
		);
	} );
} );
