/**
 * ErrorNotice component tests.
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
import {
	createTestRegistry,
	provideModules,
	untilResolved,
} from '../../../tests/js/utils';
import {
	ERROR_CODE_MISSING_REQUIRED_SCOPE,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '../util/errors';
import { fireEvent, render } from '../../../tests/js/test-utils';
import ErrorNotice from './ErrorNotice';
import { MODULES_TAGMANAGER } from '../modules/tagmanager/datastore/constants';

describe( 'ErrorNotice', () => {
	let registry;
	let invalidateResolutionSpy;
	const moduleName = 'test-module';

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{ slug: moduleName, name: 'Test Module' },
		] );
		invalidateResolutionSpy = jest.spyOn(
			registry.dispatch( MODULES_TAGMANAGER ),
			'invalidateResolution'
		);
	} );

	afterEach( () => {
		invalidateResolutionSpy.mockReset();
	} );

	async function renderErrorNotice( {
		error,
		storeName,
		hasButton = false,
	} ) {
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/tagmanager/data/accounts'
			),
			{
				body: error,
				status: 403,
			}
		);

		registry.select( MODULES_TAGMANAGER ).getAccounts();

		await untilResolved( registry, MODULES_TAGMANAGER ).getAccounts();

		expect( console ).toHaveErrored();

		const selectorError = registry
			.select( MODULES_TAGMANAGER )
			.getError( 'getAccounts', [] );

		return render(
			<ErrorNotice
				hasButton={ hasButton }
				error={ selectorError }
				storeName={ storeName }
			/>,
			{
				registry,
			}
		);
	}

	it( 'should not render the `Retry` button by default', async () => {
		const { queryByText } = await renderErrorNotice( {
			error: {
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: '',
				},
			},
			storeName: MODULES_TAGMANAGER,
		} );

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not render the `Retry` button if the error reason is `ERROR_REASON_INSUFFICIENT_PERMISSIONS`', async () => {
		const { queryByText } = await renderErrorNotice( {
			error: {
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
				},
			},
			storeName: MODULES_TAGMANAGER,
		} );

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not render the `Retry` button if the error reason is `ERROR_CODE_MISSING_REQUIRED_SCOPE`', async () => {
		const { queryByText } = await renderErrorNotice( {
			error: {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: 'Test error message',
				data: {
					reason: '',
				},
			},
			storeName: MODULES_TAGMANAGER,
		} );

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not render the `Retry` button if the error is an auth error', async () => {
		const { queryByText } = await renderErrorNotice( {
			error: {
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: '',
					reconnectURL: 'example.com',
				},
			},
			storeName: MODULES_TAGMANAGER,
		} );

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );

	it( 'should render the `Retry` button if the error is retryable and hasButton is passed', async () => {
		const { queryByText } = await renderErrorNotice( {
			error: {
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: '',
				},
			},
			storeName: MODULES_TAGMANAGER,
			hasButton: true,
		} );

		expect( queryByText( /retry/i ) ).toBeInTheDocument();
	} );

	it( 'should dispatch the `invalidateResolution` if the error is retryable', async () => {
		const { queryByText, getByRole } = await renderErrorNotice( {
			error: {
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: '',
				},
			},
			storeName: MODULES_TAGMANAGER,
		} );

		expect( queryByText( /retry/i ) ).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /retry/i } ) );

		expect( invalidateResolutionSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not render the retry button if the store name is not available', async () => {
		const { queryByText } = await renderErrorNotice( {
			error: {
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: '',
					reconnectURL: 'example.com',
				},
			},
			storeName: '',
		} );

		expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
	} );
} );
