/**
 * Tests for Error Utilities.
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
	isWPError,
	isPermissionScopeError,
	isInsufficientPermissionsError,
	ERROR_CODE_MISSING_REQUIRED_SCOPE,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
	ERROR_REASON_FORBIDDEN,
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_INVALID_JSON,
	isAuthError,
	isErrorRetryable,
	getReportErrorMessage,
} from './errors';

describe( 'Error Utilities', () => {
	describe( 'isWPError', () => {
		const code = '';
		const message = '';
		const data = {};

		it( 'should return TRUE if a correct error is passed', () => {
			expect( isWPError( { code, message, data } ) ).toBe( true );
		} );

		it( 'should return TRUE even if an error with numeric code is passed', () => {
			expect( isWPError( { code: 401, message, data } ) ).toBe( true );
		} );

		it( 'should return TRUE even if an error with non-object data is passed', () => {
			expect( isWPError( { code, message, data: '' } ) ).toBe( true );
		} );

		it( 'should return FALSE if the passed object does not have needed properties', () => {
			expect( isWPError( { code, message } ) ).toBe( false );
		} );

		it( 'should return FALSE if the provided object has wrong property types', () => {
			expect( isWPError( { code, message: [], data } ) ).toBe( false );
		} );
	} );

	describe( 'isPermissionScopeError', () => {
		it( 'should return TRUE if a correct error is passed', () => {
			expect(
				isPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				} )
			).toBe( true );
		} );

		it( 'should return FALSE if the provided object has wrong code', () => {
			expect( isPermissionScopeError( { code: 'not_found' } ) ).toBe(
				false
			);
		} );

		it( 'should return FALSE if the passed object does not have the code property', () => {
			expect( isPermissionScopeError( { message: 'Not Found' } ) ).toBe(
				false
			);
		} );
	} );

	describe( 'isInsufficientPermissionsError', () => {
		it( 'should return TRUE if an insufficient permissions error is passed', () => {
			const error = {
				data: {
					reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
				},
			};

			expect( isInsufficientPermissionsError( error ) ).toBe( true );
		} );

		it( 'should return TRUE if a forbidden permissions error is passed', () => {
			const error = {
				data: {
					reason: ERROR_REASON_FORBIDDEN,
				},
			};

			expect( isInsufficientPermissionsError( error ) ).toBe( true );
		} );

		it( 'should return FALSE if the provided object has wrong reason', () => {
			const error = {
				data: {
					reason: 'dailyLimitExceeded',
				},
			};

			expect( isInsufficientPermissionsError( error ) ).toBe( false );
		} );

		it( 'should return FALSE if the passed object does not have the code property', () => {
			expect(
				isInsufficientPermissionsError( { message: 'Not Found' } )
			).toBe( false );
		} );
	} );

	describe( 'isAuthError', () => {
		it( 'should return TRUE if the error object has the `reconnectURL` property', () => {
			const error = {
				data: {
					reconnectURL: 'example.com',
				},
			};

			expect( isAuthError( error ) ).toBe( true );
		} );

		it( 'should return FALSE if the error object does not have `reconnectURL` property', () => {
			const error = {
				data: {
					reason: 'dailyLimitExceeded',
				},
			};

			expect( isAuthError( error ) ).toBe( false );
		} );

		it( 'should return FALSE if the passed object does not have the `data` property', () => {
			const error = {
				message: 'Not Found',
			};

			expect( isAuthError( error ) ).toBe( false );
		} );
	} );

	describe.each( [
		[ 'isWPError', isWPError ],
		[ 'isPermissionScopeError', isPermissionScopeError ],
		[ 'isInsufficientPermissionsError', isInsufficientPermissionsError ],
		[ 'isAuthError', isAuthError ],
	] )( '%s', ( fnName, fn ) => {
		it( 'should return FALSE for non-plain objects', () => {
			expect( fn( new Error() ) ).toBe( false );
			expect( fn( new Date() ) ).toBe( false );
			expect( fn( [] ) ).toBe( false );
			expect( fn( null ) ).toBe( false );
		} );

		it( 'should return FALSE for non-object values', () => {
			expect( fn( undefined ) ).toBe( false );
			expect( fn( true ) ).toBe( false );
			expect( fn( 'error' ) ).toBe( false );
			expect( fn( 123 ) ).toBe( false );
		} );
	} );

	describe( 'isErrorRetryable', () => {
		it( 'should return FALSE when there is no selectorData', () => {
			expect( isErrorRetryable( { code: 'some-error' } ) ).toBe( false );
		} );

		it( 'should return FALSE when there is no storeName in the selectorData', () => {
			expect(
				isErrorRetryable(
					{ code: 'some-error' },
					{ name: 'some-selector' }
				)
			).toBe( false );
		} );

		it( 'should return FALSE when passed an insufficient permissions error', () => {
			expect(
				isErrorRetryable(
					{
						data: {
							reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
						},
					},
					{ name: 'some-selector', storeName: 'some-store' }
				)
			).toBe( false );
		} );

		it( 'should return FALSE when passed a permission scope error', () => {
			expect(
				isErrorRetryable(
					{
						code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					},
					{ name: 'some-selector', storeName: 'some-store' }
				)
			).toBe( false );
		} );

		it( 'should return FALSE when passed an auth error', () => {
			expect(
				isErrorRetryable(
					{
						data: {
							reconnectURL: 'example.com',
						},
					},
					{ name: 'some-selector', storeName: 'some-store' }
				)
			).toBe( false );
		} );

		it( 'should return TRUE when passed a retryable error', () => {
			expect(
				isErrorRetryable(
					{
						code: 'some-error',
					},
					{ name: 'some-selector', storeName: 'some-store' }
				)
			).toBe( true );
		} );
	} );

	describe( 'getReportErrorMessage', () => {
		describe.each( [
			[
				'return the same error message when error code is not internal_server_error or invalid_json',
				{ code: 'some-error', message: 'Not found' },
				'Not found',
			],
			[
				'return the appropriate error message when error code is internal_server_error',
				{
					code: ERROR_INTERNAL_SERVER_ERROR,
					message: 'Internal server error',
				},
				'There was a critical error on this website while fetching data',
			],
			[
				'return the appropriate error message when error code is invalid_json',
				{ code: ERROR_INVALID_JSON, message: 'Invalid JSON' },
				'The server provided an invalid response',
			],
		] )( '%s', ( label, error, message ) => {
			it( `should ${ label }`, () => {
				expect( getReportErrorMessage( error ) ).toEqual( message );
			} );
		} );
	} );
} );
