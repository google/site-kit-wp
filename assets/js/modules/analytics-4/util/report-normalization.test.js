/**
 * Analytics 4 report normalization utility tests.
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
 * External dependencies
 */
import isPlainObject from 'lodash/isPlainObject';

/**
 * Internal dependencies
 */
import { normalizeReportOptions } from './report-normalization';

describe( 'normalizeReportOptions', () => {
	it( 'always returns a plain options object', () => {
		expect( isPlainObject( normalizeReportOptions() ) ).toBe( true );
	} );

	it( 'returns the same value for the same options', () => {
		expect( normalizeReportOptions() ).toStrictEqual( normalizeReportOptions() );
	} );

	describe( 'metrics', () => {
		it( 'normalizes no metrics into an empty array', () => {
			expect( normalizeReportOptions() ).toMatchObject( { metrics: [] } );
			expect( normalizeReportOptions( {} ) ).toMatchObject( { metrics: [] } );
		} );

		it( 'normalizes single string metrics into an array of objects', () => {
			const { metrics } = normalizeReportOptions( { metrics: 'foo' } );

			expect( metrics ).toEqual( [ { expression: 'foo' } ] );
		} );

		it( 'normalizes an array of strings into an array of objects', () => {
			const { metrics } = normalizeReportOptions( { metrics: [ 'foo', 'bar' ] } );

			expect( metrics ).toEqual( [
				{ expression: 'foo' },
				{ expression: 'bar' },
			] );
		} );

		it( 'normalizes a single metric object into an array of objects', () => {
			const options = { metrics: { expression: 'foo', name: 'bar' } };
			const { metrics } = normalizeReportOptions( options );

			expect( metrics ).toEqual( [
				{ expression: 'foo', name: 'bar' },
			] );
		} );

		it( 'normalizes an array of objects into the same values', () => {
			const options = { metrics: [
				{ expression: 'foo', name: 'bar' },
				{ expression: 'bar' },
			] };
			const { metrics } = normalizeReportOptions( options );
			expect( metrics ).toEqual( [
				{ expression: 'foo', name: 'bar' },
				{ expression: 'bar' },
			] );
		} );

		it( 'normalizes an array of strings and objects into an array of objects', () => {
			const options = { metrics: [
				{ expression: 'foo', name: 'bar' },
				'bar',
			] };
			const { metrics } = normalizeReportOptions( options );
			expect( metrics ).toEqual( [
				{ expression: 'foo', name: 'bar' },
				{ expression: 'bar' },
			] );
		} );
	} );
} );
