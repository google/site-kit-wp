/**
 * WPDashboardReportError component tests.
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
import { provideModules, render } from '../../../../../tests/js/test-utils';
import WPDashboardReportError from './WPDashboardReportError';

describe( 'WPDashboardReportError', () => {
	it( 'should only render one error per module when there are multiple instances with same error', () => {
		const error = {
			code: 'test_error',
			message: 'Test error message',
			data: {
				reconnectURL: '#',
			},
		};

		function TestRender() {
			return (
				<div>
					<WPDashboardReportError
						moduleSlug="search-console"
						error={ error }
					/>
					<WPDashboardReportError
						moduleSlug="search-console"
						error={ error }
					/>
					<WPDashboardReportError
						moduleSlug="analytics-4"
						error={ error }
					/>
					<WPDashboardReportError
						moduleSlug="analytics-4"
						error={ error }
					/>
				</div>
			);
		}

		const { container } = render( <TestRender />, {
			setupRegistry: ( registry ) => {
				provideModules( registry );
			},
		} );

		expect(
			container.querySelectorAll( '.googlesitekit-error-text' )
		).toHaveLength( 2 );

		expect( container ).toMatchSnapshot();
	} );
} );
