/**
 * Tests for Vitest Console Matchers
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

/* eslint-disable no-console */

/**
 * External dependencies
 */
import { describe, it, expect } from 'vitest';

describe( 'vitest-console-matchers', () => {
	describe( 'toHaveErrored', () => {
		it( 'passes when console.error was called', () => {
			console.error( 'Test error' );
			expect( console ).toHaveErrored();
		} );

		it( 'passes with .not when console.error was not called', () => {
			expect( console ).not.toHaveErrored();
		} );
	} );

	describe( 'toHaveErroredWith', () => {
		it( 'passes when console.error was called with specific arguments', () => {
			console.error( 'Specific error', 123 );
			expect( console ).toHaveErroredWith( 'Specific error', 123 );
		} );
	} );

	describe( 'toHaveWarned', () => {
		it( 'passes when console.warn was called', () => {
			console.warn( 'Test warning' );
			expect( console ).toHaveWarned();
		} );

		it( 'passes with .not when console.warn was not called', () => {
			expect( console ).not.toHaveWarned();
		} );
	} );

	describe( 'toHaveWarnedWith', () => {
		it( 'passes when console.warn was called with specific arguments', () => {
			console.warn( 'Specific warning', { code: 500 } );
			expect( console ).toHaveWarnedWith( 'Specific warning', {
				code: 500,
			} );
		} );
	} );

	describe( 'toHaveLogged', () => {
		it( 'passes when console.log was called', () => {
			console.log( 'Test log' );
			expect( console ).toHaveLogged();
		} );

		it( 'passes with .not when console.log was not called', () => {
			expect( console ).not.toHaveLogged();
		} );
	} );

	describe( 'toHaveLoggedWith', () => {
		it( 'passes when console.log was called with specific arguments', () => {
			console.log( 'Specific log', 'value' );
			expect( console ).toHaveLoggedWith( 'Specific log', 'value' );
		} );
	} );

	describe( 'toHaveInformed', () => {
		it( 'passes when console.info was called', () => {
			console.info( 'Test info' );
			expect( console ).toHaveInformed();
		} );

		it( 'passes with .not when console.info was not called', () => {
			expect( console ).not.toHaveInformed();
		} );
	} );

	describe( 'toHaveInformedWith', () => {
		it( 'passes when console.info was called with specific arguments', () => {
			console.info( 'Specific info', true );
			expect( console ).toHaveInformedWith( 'Specific info', true );
		} );
	} );
} );
