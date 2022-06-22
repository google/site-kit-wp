/**
 * ReportError component tests.
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
import { createTestRegistry, provideModules } from '../../../tests/js/utils';
import {
	ERROR_CODE_MISSING_REQUIRED_SCOPE,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '../util/errors';
import { render } from '../../../tests/js/test-utils';
import ReportError from './ReportError';
import { MODULES_ANALYTICS } from '../modules/analytics/datastore/constants';

describe( 'ReportError', () => {
	let registry;
	const moduleName = 'test-module';

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{ slug: moduleName, name: 'Test Module' },
		] );
	} );

	it( 'renders the error message', () => {
		const { container } = render(
			<ReportError
				moduleSlug={ moduleName }
				error={ {
					code: 'test-error-code',
					message: 'Test error message',
					data: {},
				} }
			/>,
			{
				registry,
			}
		);

		expect( container.querySelector( 'p' ).textContent ).toEqual(
			'Test error message'
		);
	} );

	it( 'renders the error message without HTML tags', () => {
		const { container } = render(
			<ReportError
				moduleSlug={ moduleName }
				error={ {
					code: 'test-error-code',
					message:
						'<h1>Test error message <b>with</b> HTML tags</h1>',
					data: {},
				} }
			/>,
			{
				registry,
			}
		);

		expect( container.querySelector( 'p' ).textContent ).toEqual(
			'Test error message with HTML tags'
		);
	} );

	it( 'renders the insufficient permission error when ERROR_REASON_INSUFFICIENT_PERMISSIONS is provided as reason', () => {
		const { container } = render(
			<ReportError
				moduleSlug={ moduleName }
				error={ {
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
					},
				} }
			/>,
			{
				registry,
			}
		);

		expect( container.querySelector( 'h3' ).textContent ).toEqual(
			'Insufficient permissions in Test Module'
		);
	} );

	it( 'should not render the `Retry` button if the error's `selectorData.name` is not `getReport`', () => {
		const { queryByText } = render(
			<ReportError
				moduleSlug="analytics"
				error={ {
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
					},
					selectorData: {
						args: [],
						name: 'getAccountID',
						storeName: MODULES_ANALYTICS,
					},
				} }
			/>,
			{
				registry,
			}
		);

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not render the `Retry` button if the error reason is `ERROR_REASON_INSUFFICIENT_PERMISSIONS`', () => {
		const { queryByText } = render(
			<ReportError
				moduleSlug="analytics"
				error={ {
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
					},
					selectorData: {
						args: [],
						name: 'getAccountID',
						storeName: MODULES_ANALYTICS,
					},
				} }
			/>,
			{
				registry,
			}
		);

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not render the `Retry` button if the error reason is `ERROR_CODE_MISSING_REQUIRED_SCOPE`', () => {
		const { queryByText } = render(
			<ReportError
				moduleSlug="analytics"
				error={ {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: 'Test error message',
					data: {
						reason: '',
					},
					selectorData: {
						args: [],
						name: 'getAccountID',
						storeName: MODULES_ANALYTICS,
					},
				} }
			/>,
			{
				registry,
			}
		);

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not render the `Retry` button if the error is an auth error', () => {
		const { queryByText } = render(
			<ReportError
				moduleSlug="analytics"
				error={ {
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: '',
						reconnectURL: 'example.com',
					},
					selectorData: {
						args: [],
						name: 'getAccountID',
						storeName: MODULES_ANALYTICS,
					},
				} }
			/>,
			{
				registry,
			}
		);

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );

	it( 'should render the `Retry` button if the error selector name is `getReport`', () => {
		const { queryByText } = render(
			<ReportError
				moduleSlug="analytics"
				error={ {
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: '',
					},
					selectorData: {
						args: [
							{
								dimensions: [ 'ga:date' ],
								metrics: [ { expression: 'ga:users' } ],
								startDate: '2020-08-11',
								endDate: '2020-09-07',
							},
						],
						name: 'getReport',
						storeName: MODULES_ANALYTICS,
					},
				} }
			/>,
			{
				registry,
			}
		);

		expect( queryByText( /retry/i ) ).toBeInTheDocument();
	} );
} );
