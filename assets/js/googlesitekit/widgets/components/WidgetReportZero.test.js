/**
 * WidgetReportZero component tests.
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
import {
	render,
	createTestRegistry,
	provideModules,
} from '../../../../../tests/js/test-utils';
import WidgetReportZero from './WidgetReportZero';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import ReportZero from '@/js/components/ReportZero';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';

describe( 'WidgetReportZero', () => {
	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
		provideModules( registry );
	} );

	it( 'sets widget state when rendered and unsets when unmounted', () => {
		const widgetSlug = 'testWidget';
		const moduleSlug = MODULE_SLUG_ANALYTICS_4;

		// Initial state should be null.
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toBe( null );

		// Special state should be set upon render.
		const widget = render(
			<WidgetReportZero
				widgetSlug={ widgetSlug }
				moduleSlug={ moduleSlug }
			/>,
			{ registry }
		);
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toMatchObject( {
			Component: ReportZero,
			metadata: { moduleSlug },
		} );

		// Special state should be unset again upon unmount.
		widget.unmount();
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toBe( null );
	} );

	it( 'only considers moduleSlug prop for widget state', () => {
		const widgetSlug = 'testWidget';
		const moduleSlug = MODULE_SLUG_ANALYTICS_4;

		// Pass extraProp (which should not be included in metadata).
		render(
			<WidgetReportZero
				widgetSlug={ widgetSlug }
				moduleSlug={ moduleSlug }
				extraProp="propValue"
			/>,
			{ registry }
		);

		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toMatchObject( {
			Component: ReportZero,
			metadata: { moduleSlug },
		} );
	} );

	it( 'renders the same output as ReportZero with the same props (except widgetSlug)', () => {
		const props = {
			moduleSlug: MODULE_SLUG_ANALYTICS_4,
			description: 'There is no data!',
		};

		// WidgetReportZero wraps ReportZero, so the output must match.
		const widgetContainer = render(
			<WidgetReportZero widgetSlug="testWidget" { ...props } />,
			{ registry }
		).container;
		const container = render( <ReportZero { ...props } />, {
			registry,
		} ).container;

		expect( widgetContainer.innerHTML ).toEqual( container.innerHTML );
	} );
} );
