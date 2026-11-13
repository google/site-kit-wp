/**
 * Reader Revenue Manager `ExpressSetupFallback` component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Registry } from '@/js/googlesitekit-data';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	provideModules,
	render,
} from '@tests/js/test-utils';
import ExpressSetupFallback from './ExpressSetupFallback';

const ERROR_TITLE = 'We couldn’t set up your survey';

const storeError = {
	code: 'internal_server_error',
	message: 'Store error message',
	data: { status: 500 },
};

describe( 'ExpressSetupFallback', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		global.location.href = 'http://example.com/';

		registry = createTestRegistry() as Registry;
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setErrorForAction( storeError, 'createPublication', [] );
	} );

	it( 'should render the progress bar when there are no children and errors are not shown', () => {
		const { container, queryByText } = render(
			<ExpressSetupFallback
				showErrors={ false }
				errorTitle={ ERROR_TITLE }
			/>,
			{ registry }
		);

		expect(
			container.querySelector( '.mdc-linear-progress' )
		).toBeInTheDocument();
		expect( queryByText( ERROR_TITLE ) ).not.toBeInTheDocument();
	} );

	it( 'should render the store errors when there are no children and errors are shown', () => {
		const { container, getByText } = render(
			<ExpressSetupFallback errorTitle={ ERROR_TITLE } showErrors />,
			{ registry }
		);

		expect( getByText( ERROR_TITLE ) ).toBeInTheDocument();
		expect( getByText( /Store error message/ ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.mdc-linear-progress' )
		).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'errors are not shown', false ],
		[ 'errors are shown', true ],
	] )(
		'should render the title and children in place of the store errors and the progress bar when %s',
		( _, showErrors ) => {
			const { container, getByText, queryByText } = render(
				<ExpressSetupFallback
					showErrors={ showErrors }
					errorTitle={ ERROR_TITLE }
				>
					<p>Custom error content</p>
				</ExpressSetupFallback>,
				{ registry }
			);

			expect( getByText( ERROR_TITLE ) ).toBeInTheDocument();
			expect( getByText( 'Custom error content' ) ).toBeInTheDocument();
			expect(
				queryByText( /Store error message/ )
			).not.toBeInTheDocument();
			expect(
				container.querySelector( '.mdc-linear-progress' )
			).not.toBeInTheDocument();
		}
	);
} );
