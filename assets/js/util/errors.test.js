/**
 * Tests for Error Utilities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
	ERROR_CODE_MISSING_REQUIRED_SCOPE,
} from './errors';

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

	it( 'should return FALSE for non-plain objects', () => {
		expect( isWPError( new Error ) ).toBe( false );
		expect( isWPError( new Date ) ).toBe( false );
		expect( isWPError( [] ) ).toBe( false );
		expect( isWPError( null ) ).toBe( false );
	} );

	it( 'should return FALSE for non-object values', () => {
		expect( isWPError( undefined ) ).toBe( false );
		expect( isWPError( true ) ).toBe( false );
		expect( isWPError( 'error' ) ).toBe( false );
		expect( isWPError( 123 ) ).toBe( false );
	} );
} );

describe( 'isPermissionScopeError', () => {
	it( 'should return TRUE if a correct error is passed', () => {
		expect( isPermissionScopeError( { code: ERROR_CODE_MISSING_REQUIRED_SCOPE } ) ).toBe( true );
	} );

	it( 'should return FALSE if the provided object has wrong code', () => {
		expect( isPermissionScopeError( { code: 'not_found' } ) ).toBe( false );
	} );

	it( 'should return FALSE if the passed object does not have the code property', () => {
		expect( isPermissionScopeError( { message: 'Not Found' } ) ).toBe( false );
	} );

	it( 'should return FALSE for non-object values', () => {
		expect( isPermissionScopeError( undefined ) ).toBe( false );
		expect( isPermissionScopeError( true ) ).toBe( false );
		expect( isPermissionScopeError( 'error' ) ).toBe( false );
		expect( isPermissionScopeError( 123 ) ).toBe( false );
	} );
} );
