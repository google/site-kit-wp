/**
 * Feature count cache and menu badge entry point tests.
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
import {
	FEATURE_COUNT_CHANNEL_MESSAGES,
	FEATURE_COUNT_CHANNEL_NAME,
	clearFeatureCountCache,
	renderFeaturesBadgeFromCache,
} from './util/features-badge';

jest.mock( './util/features-badge', () => ( {
	...jest.requireActual( './util/features-badge' ),
	clearFeatureCountCache: jest.fn(),
	renderFeaturesBadgeFromCache: jest.fn(),
} ) );

const fingerprint = {
	connectedModules: [ 'search-console' ],
	pluginVersion: '1.187.0',
	userID: 1,
};

const originalBroadcastChannel = global.BroadcastChannel;
const originalData = global._googlesitekitFeaturesBadgeData;

describe( 'global features badge', () => {
	const addEventListener = jest.fn();

	beforeEach( () => {
		global._googlesitekitFeaturesBadgeData = {
			...fingerprint,
			resetSession: false,
		};

		global.BroadcastChannel = jest.fn( () => ( {
			addEventListener,
		} ) ) as unknown as typeof BroadcastChannel;
	} );

	afterEach( () => {
		global.BroadcastChannel = originalBroadcastChannel;
		global._googlesitekitFeaturesBadgeData = originalData;
		jest.clearAllMocks();
	} );

	function loadEntry() {
		jest.isolateModules( () => {
			require( './googlesitekit-features-badge' );
		} );
	}

	it( 'should render on load and subscribe to updates', () => {
		loadEntry();

		expect( renderFeaturesBadgeFromCache ).toHaveBeenCalledWith(
			fingerprint
		);

		expect( global.BroadcastChannel ).toHaveBeenCalledWith(
			FEATURE_COUNT_CHANNEL_NAME
		);

		expect( addEventListener ).toHaveBeenCalledWith(
			'message',
			expect.any( Function )
		);

		expect( clearFeatureCountCache ).not.toHaveBeenCalled();
	} );

	it( 'should render again for updates but ignore unrelated messages', () => {
		loadEntry();
		expect( renderFeaturesBadgeFromCache ).toHaveBeenCalledTimes( 1 );

		const onMessage = addEventListener.mock.calls[ 0 ][ 1 ];

		onMessage( new MessageEvent( 'message', { data: 'unrelated' } ) );
		expect( renderFeaturesBadgeFromCache ).toHaveBeenCalledTimes( 1 );

		onMessage(
			new MessageEvent( 'message', {
				data: FEATURE_COUNT_CHANNEL_MESSAGES.UPDATED,
			} )
		);

		expect( renderFeaturesBadgeFromCache ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should clear a reset session before rendering', () => {
		global._googlesitekitFeaturesBadgeData.resetSession = true;

		loadEntry();
		expect( clearFeatureCountCache ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render even if BroadcastChannel is unavailable', () => {
		global.BroadcastChannel = jest.fn( () => {
			throw new Error( 'Unavailable' );
		} ) as unknown as typeof BroadcastChannel;

		expect( loadEntry ).not.toThrow();
		expect( renderFeaturesBadgeFromCache ).toHaveBeenCalledWith(
			fingerprint
		);
	} );
} );
