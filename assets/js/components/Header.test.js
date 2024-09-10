/**
 * Header component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	act,
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	provideUserInfo,
} from '../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../googlesitekit/constants';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../modules/analytics-4/datastore/constants';
import Header from './Header';
import Null from './Null';

describe( 'Header', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( [] );
	} );

	it( 'renders', () => {
		render( <Header />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
	} );

	it( 'can render a subheader', async () => {
		const { waitForRegistry, queryByTestID } = render(
			<Header subHeader={ <div data-testid="sub" /> } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		await waitForRegistry();

		expect( queryByTestID( 'sub' ) ).toBeInTheDocument();
	} );

	it( 'adds a class if the subheader renders any children', async () => {
		const { container, rerender } = render(
			<Header subHeader={ <Null /> } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( container.firstChild ).not.toHaveClass(
			'googlesitekit-header--has-subheader'
		);

		await act( () => {
			rerender( <Header subHeader={ <div /> } /> );
			return new Promise( ( resolve ) => setImmediate( resolve ) );
		} );

		expect( container.firstChild ).toHaveClass(
			'googlesitekit-header--has-subheader'
		);
	} );
} );
