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
import { render } from '../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_DASHBOARD,
	VIEW_CONTEXT_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';
import { Provider as ViewContextProvider } from './Root/ViewContextContext';
import SourceLink from './SourceLink';

describe( 'SourceLink', () => {
	it( 'should not render the SourceLink when the view context is "view only"', async () => {
		const { container } = render(
			<ViewContextProvider value={ VIEW_CONTEXT_DASHBOARD_VIEW_ONLY }>
				<SourceLink
					name="Analytics"
					href={ 'https://analytics.google.com/test' }
					external
				/>
			</ViewContextProvider>
		);

		expect( container ).not.toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).toBeNull();
	} );

	it( 'should render the SourceLink normally when the view context is NOT "view only"', async () => {
		const { container } = render(
			<ViewContextProvider value={ VIEW_CONTEXT_DASHBOARD }>
				<SourceLink
					name="Analytics"
					href={ 'https://analytics.google.com/test' }
					external
				/>
			</ViewContextProvider>
		);

		expect( container ).toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).not.toBeNull();
	} );
} );
