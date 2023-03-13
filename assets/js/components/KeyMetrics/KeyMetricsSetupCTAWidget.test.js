/**
 * KeyMetricsSetupCTAWidget component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import KeyMetricsSetupCTAWidget from './KeyMetricsSetupCTAWidget';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import {
	render,
	createTestRegistry,
	provideModules,
} from '../../../../tests/js/test-utils';

describe( 'KeyMetricsSetupCTAWidget', () => {
	let registry;

	beforeEach( async () => {
		registry = createTestRegistry();
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( true );

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);
	} );

	it( 'does not render when SC is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: false,
			},
		] );

		const Widget = ( { children } ) => <div>{ children }</div>;
		const WidgetNull = () => <div>NULL</div>;

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent( 'NULL' );
	} );

	it( 'does not render when GA4 is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		const Widget = ( { children } ) => <div>{ children }</div>;
		const WidgetNull = () => <div>NULL</div>;

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent( 'NULL' );
	} );

	it( 'does render when SC and GA4 are both connected', async () => {
		global._googlesitekitUserData.isUserInputCompleted = false;
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		const Widget = ( { children } ) => <div>{ children }</div>;
		const WidgetNull = () => <div>NULL</div>;

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent(
			'TODO: UI for KeyMetricsSetupCTAWidget'
		);
	} );
} );
