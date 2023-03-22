/**
 * GA4 Dashboard Widget Switcher component tests.
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
import {
	createTestRegistry,
	provideModules,
	render,
} from '../../../../../../tests/js/test-utils';
import { enabledFeatures } from '../../../../features';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import GA4DashboardWidgetSwitcher from './GA4DashboardWidgetSwitcher';

describe( 'GA4DashboardWidgetSwitcher', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
	} );

	it( 'should render the UA widget when UA dashboard view is enabled', () => {
		registry.dispatch( MODULES_ANALYTICS ).setSettings( {
			dashboardView: 'universal-analytics',
		} );

		const { container } = render(
			<GA4DashboardWidgetSwitcher
				UA={ () => <div>UA</div> }
				GA4={ () => <div>GA4</div> }
			/>,
			{ registry }
		);

		expect( container ).toHaveTextContent( 'UA' );
	} );

	it( 'should render the GA4 widget when GA4 dashboard view is enabled', () => {
		enabledFeatures.add( 'ga4Reporting' );
		registry.dispatch( MODULES_ANALYTICS ).setSettings( {
			dashboardView: 'google-analytics-4',
		} );

		const { container } = render(
			<GA4DashboardWidgetSwitcher
				UA={ () => <div>UA</div> }
				GA4={ () => <div>GA4</div> }
			/>,
			{ registry }
		);

		expect( container ).toHaveTextContent( 'GA4' );
	} );
} );
