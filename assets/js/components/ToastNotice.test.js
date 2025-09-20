/**
 * ToastNotification component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { act, render } from '../../../tests/js/test-utils';
import ToastNotice from './ToastNotice';

describe( 'ToastNotification', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	it( 'should disappear after 5500ms', () => {
		render( <ToastNotice title="Notice title" /> );

		const toast = document.querySelector( '.googlesitekit-toast-notice' );
		expect( toast ).toBeInTheDocument();

		act( () => {
			jest.advanceTimersByTime( 5500 );
		} );

		expect( toast ).not.toBeInTheDocument();
	} );
} );
