/**
 * AnalyticsNotice component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import AnalyticsNotice from './AnalyticsNotice';
import {
	createTestRegistry,
	render,
	unsubscribeFromAll,
} from '../../../../../../tests/js/test-utils';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import {
	TRACKING_LOGGED_IN_USERS,
	TRACKING_CONTENT_CREATORS,
} from '../../../analytics/components/common/TrackingExclusionSwitches';

describe( 'AnalyticsNotice', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings & modules to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
		registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it.each( [
		[
			TRACKING_LOGGED_IN_USERS,
			'Analytics is currently set to not track some logged-in users. If you’re setting up or testing experiments on optimize.google.com, make sure you’re not logged in to your WordPress site, otherwise the experiment will fail.',
		],
		[
			TRACKING_CONTENT_CREATORS,
			'Analytics is currently set to not track some logged-in users. If you’re setting up or testing experiments on optimize.google.com, make sure you’re not logged in to your WordPress site, otherwise the experiment will fail.',
		],
	] )(
		'should render the correct message when Analytics tracking is excluded from %s',
		( args, expected ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.setTrackingDisabled( [ args ] );

			const { container } = render( <AnalyticsNotice />, {
				registry,
			} );

			const selectedText = container.querySelector( 'p' );
			expect( selectedText ).toHaveTextContent( expected );
		}
	);

	it( 'should not render with no one excluded from Analytics tracking', () => {
		registry.dispatch( MODULES_ANALYTICS ).setTrackingDisabled( [] );

		const { container } = render( <AnalyticsNotice />, {
			registry,
		} );
		expect( container.querySelector( 'p' ) ).toEqual( null );
	} );
} );
