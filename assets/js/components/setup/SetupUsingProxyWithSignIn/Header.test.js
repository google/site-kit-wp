/**
 * Header component tests.
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

import {
	render,
	createTestRegistry,
	provideUserCapabilities,
	provideUserAuthentication,
	provideUserInfo,
	provideModules,
} from '../../../../../tests/js/test-utils';
import Header from './Header';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_SPLASH } from '@/js/googlesitekit/constants';

describe( 'Header', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
	} );

	it( 'should render the progress indicator in the header when setupFlowRefresh is enabled', async () => {
		const { container, waitForRegistry } = render( <Header />, {
			registry,
			viewContext: VIEW_CONTEXT_SPLASH,
			features: [ 'setupFlowRefresh' ],
		} );

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-progress-indicator' )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should not render the progress indicator in the header when setupFlowRefresh is disabled', async () => {
		const { container, waitForRegistry } = render( <Header />, {
			registry,
			viewContext: VIEW_CONTEXT_SPLASH,
			features: [],
		} );

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-progress-indicator' )
		).toBeNull();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should have only the initial stub segment when setupFlowRefresh is enabled (no active segments yet)', async () => {
		const { container, waitForRegistry } = render( <Header />, {
			registry,
			viewContext: VIEW_CONTEXT_SPLASH,
			features: [ 'setupFlowRefresh' ],
		} );

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
		const segments = container.querySelectorAll(
			'.googlesitekit-progress-indicator__segment'
		);
		// Only the stub segment should be present at initial render.
		expect( segments.length ).toBe( 1 );
	} );
} );
