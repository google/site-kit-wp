/**
 * Site Goals BreakdownErrorNotice tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { fireEvent, render } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import BreakdownErrorNotice from './BreakdownErrorNotice';

describe( 'BreakdownErrorNotice', () => {
	let registry: WPDataRegistry;

	const genericError = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};
	const permissionsError = {
		code: 'insufficient_permissions',
		message: 'Insufficient permissions',
		data: { status: 403, reason: 'insufficientPermissions' },
	};

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'renders the generic error variant with a retry CTA and troubleshooting link', () => {
		const { getByRole, getByText } = render(
			<BreakdownErrorNotice
				error={ genericError }
				permissionsTitle="Individual form tracking setup failed"
				onRetry={ () => {} }
				onDismiss={ () => {} }
			/>,
			{ registry }
		);

		expect( getByText( /Analytics update failed/ ) ).toBeInTheDocument();
		expect( getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( getByText( 'Got it' ) ).toBeInTheDocument();
		expect(
			getByRole( 'link', { name: /Learn more/ } )
		).toBeInTheDocument();
	} );

	it( 'renders the permissions error variant with the parent-supplied title', () => {
		const { getByText } = render(
			<BreakdownErrorNotice
				error={ permissionsError }
				permissionsTitle="Individual form tracking setup failed"
				onRetry={ () => {} }
				onDismiss={ () => {} }
			/>,
			{ registry }
		);

		expect(
			getByText( /Individual form tracking setup failed/ )
		).toBeInTheDocument();
		expect( getByText( /insufficient permissions/ ) ).toBeInTheDocument();
	} );

	it( 'invokes onRetry and onDismiss from their respective buttons', () => {
		const onRetry = jest.fn();
		const onDismiss = jest.fn();

		const { getByRole, getByText } = render(
			<BreakdownErrorNotice
				error={ genericError }
				permissionsTitle="Setup failed"
				onRetry={ onRetry }
				onDismiss={ onDismiss }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );
		fireEvent.click( getByText( 'Got it' ) );

		expect( onRetry ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
