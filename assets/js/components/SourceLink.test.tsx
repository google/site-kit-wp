/**
 * SourceLink tests.
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

/**
 * Internal dependencies
 */
import { render, fireEvent } from '../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	Provider as WidgetContextProvider,
	type WidgetContextValue,
} from '@/js/googlesitekit/widgets/components/WidgetContext';
import * as tracking from '@/js/util/tracking';
import SourceLink from './SourceLink';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SourceLink', () => {
	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should not render the SourceLink when the view context is "view only"', () => {
		const { container } = render(
			<SourceLink
				name="Analytics"
				href="https://analytics.google.com/test"
				external
			/>,
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);

		expect( container ).not.toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).toBeNull();
	} );

	it( 'should render the SourceLink normally when the view context is NOT "view only"', () => {
		const { container } = render(
			<SourceLink
				name="Analytics"
				href="https://analytics.google.com/test"
				external
			/>,
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( container ).toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).not.toBeNull();
	} );

	it( 'should track event when SourceLink is clicked within a widget', () => {
		const widgetSlug = 'test-widget-slug';
		const mockWidget: WidgetContextValue = {
			slug: widgetSlug,
		};

		const { container } = render(
			<WidgetContextProvider value={ mockWidget }>
				<SourceLink
					name="Analytics"
					href="https://analytics.google.com/test"
					external
				/>
			</WidgetContextProvider>,
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		const link = container.querySelector( 'a' );
		expect( link ).not.toBeNull();

		fireEvent.click( link! );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_widget`,
			'click_source_link',
			widgetSlug
		);
	} );

	it( 'should not track event when SourceLink is clicked without widget context', () => {
		const { container } = render(
			<SourceLink
				name="Analytics"
				href="https://analytics.google.com/test"
				external
			/>,
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		const link = container.querySelector( 'a' );
		expect( link ).not.toBeNull();

		fireEvent.click( link! );

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );
} );
