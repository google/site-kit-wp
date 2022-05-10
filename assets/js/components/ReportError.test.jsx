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
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../util/errors';
import { render } from '../../../tests/js/test-utils';
import ReportError from './ReportError';

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
} );
