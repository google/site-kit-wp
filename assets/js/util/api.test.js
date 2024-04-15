/**
 * API utility function tests.
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
import { trackAPIError, excludedErrorCodes } from './api';
import { enableTracking } from './tracking';
import { DATA_LAYER } from './tracking/constants';

describe( 'trackAPIError', () => {
	let dataLayerPushSpy;

	beforeEach( () => {
		enableTracking();
		global[ DATA_LAYER ] = [];
		dataLayerPushSpy = jest.spyOn( global[ DATA_LAYER ], 'push' );
	} );

	it( 'should track API error message, code and reasons', () => {
		trackAPIError( {
			method: 'test-method',
			type: 'test-type',
			identifier: 'test-identifier',
			datapoint: 'test-datapoint',
			error: {
				data: {
					reason: 'test-error-reason',
				},
				message: 'test-error-message',
				code: 'test-error-code',
			},
		} );
		expect( dataLayerPushSpy ).toHaveBeenCalledTimes( 4 );
		const [ event, eventName, eventData ] =
			dataLayerPushSpy.mock.calls[ 3 ][ 0 ];
		expect( event ).toEqual( 'event' );
		expect( eventName ).toEqual(
			'test-method:test-type/test-identifier/data/test-datapoint'
		);
		expect( eventData.event_category ).toEqual( 'api_error' );
		expect( eventData.event_label ).toEqual(
			'test-error-message (code: test-error-code, reason: test-error-reason)'
		);
		expect( eventData.value ).toEqual( 'test-error-code' );
	} );

	it( 'should track API error message & code with no reason', () => {
		trackAPIError( {
			method: 'test-method',
			type: 'test-type',
			identifier: 'test-identifier',
			datapoint: 'test-datapoint',
			error: {
				data: {},
				message: 'test-error-message',
				code: 'test-error-code',
			},
		} );
		expect( dataLayerPushSpy ).toHaveBeenCalledTimes( 1 );
		const [ event, eventName, eventData ] =
			dataLayerPushSpy.mock.calls[ 0 ][ 0 ];
		expect( event ).toEqual( 'event' );
		expect( eventName ).toEqual(
			'test-method:test-type/test-identifier/data/test-datapoint'
		);
		expect( eventData.event_category ).toEqual( 'api_error' );
		expect( eventData.event_label ).toEqual(
			'test-error-message (code: test-error-code)'
		);
		expect( eventData.value ).toEqual( 'test-error-code' );
	} );

	it( 'should track API error message & code with no data', () => {
		trackAPIError( {
			method: 'test-method',
			type: 'test-type',
			identifier: 'test-identifier',
			datapoint: 'test-datapoint',
			error: {
				message: 'test-error-message',
				code: 'test-error-code',
			},
		} );
		expect( dataLayerPushSpy ).toHaveBeenCalledTimes( 1 );
		const [ event, eventName, eventData ] =
			dataLayerPushSpy.mock.calls[ 0 ][ 0 ];
		expect( event ).toEqual( 'event' );
		expect( eventName ).toEqual(
			'test-method:test-type/test-identifier/data/test-datapoint'
		);
		expect( eventData.event_category ).toEqual( 'api_error' );
		expect( eventData.event_label ).toEqual(
			'test-error-message (code: test-error-code)'
		);
		expect( eventData.value ).toEqual( 'test-error-code' );
	} );

	it.each( excludedErrorCodes.map( ( code ) => [ code ] ) )(
		"shouldn't track errors with the %s code",
		( excludedCode ) => {
			trackAPIError( {
				method: 'test-method',
				type: 'test-type',
				identifier: 'test-identifier',
				datapoint: 'test-datapoint',
				error: {
					data: {
						reason: 'test-error-reason',
					},
					message: 'test-error-message',
					code: excludedCode,
				},
			} );
			expect( dataLayerPushSpy ).not.toHaveBeenCalled();
		}
	);

	it.each( [ [ 'connection-check', 'core', 'site', 'connection-check' ] ] )(
		"shouldn't track errors for the %s endpoint",
		( _, type, identifier, datapoint ) => {
			trackAPIError( {
				type,
				identifier,
				datapoint,
				error: { message: 'test-message' },
			} );
			expect( dataLayerPushSpy ).not.toHaveBeenCalled();
		}
	);
} );
