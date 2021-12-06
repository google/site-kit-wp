/**
 * InternalServerError component tests.
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
import InternalServerError from './InternalServerError';
import { render, createTestRegistry } from '../../../../tests/js/test-utils';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

describe( 'InternalServerError', () => {
	const registry = createTestRegistry();

	it( 'should display the notification when the internal server error is set', () => {
		const error = {
			id: 'module-setup-error',
			title: 'Test Error',
			description: 'Error message',
		};

		registry.dispatch( CORE_SITE ).setInternalServerError( error );

		const { getAllByText } = render( <InternalServerError />, {
			registry,
		} );

		const title = getAllByText( error.title );
		expect( title[ 0 ] ).not.toBeUndefined();

		const description = getAllByText( error.description );
		expect( description[ 0 ] ).not.toBeUndefined();
	} );

	it( 'should render nothing if the internal server error is not set', () => {
		registry.dispatch( CORE_SITE ).clearInternalServerError();

		const { container } = render( <InternalServerError />, { registry } );
		expect( container ).toBeEmptyDOMElement();
	} );
} );
