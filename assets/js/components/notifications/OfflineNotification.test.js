/**
 * OfflineNotification component tests.
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
import {
	render,
	createTestRegistry,
	act,
} from '../../../../tests/js/test-utils';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import OfflineNotification from './OfflineNotification';

describe( 'OfflineNotification', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should display the notification when offline', () => {
		registry.dispatch( CORE_UI ).setIsOnline( false );

		const { getByText } = render( <OfflineNotification />, {
			registry,
		} );

		expect( getByText( /you are currently offline/i ) ).toBeInTheDocument();
	} );

	it( 'should not display the notification when online', () => {
		const { queryByText } = render( <OfflineNotification />, {
			registry,
		} );

		expect(
			queryByText( /you are currently offline/i )
		).not.toBeInTheDocument();
	} );

	it( 'should dismiss the notification when connection is back', () => {
		registry.dispatch( CORE_UI ).setIsOnline( false );

		const { queryByText } = render( <OfflineNotification />, {
			registry,
		} );

		expect(
			queryByText( /you are currently offline/i )
		).toBeInTheDocument();

		act( () => {
			registry.dispatch( CORE_UI ).setIsOnline( true );
		} );

		expect(
			queryByText( /you are currently offline/i )
		).not.toBeInTheDocument();
	} );
} );
