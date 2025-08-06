/**
 * Tests for watchBlocks.
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

/* eslint-disable sitekit/acronym-case */

/**
 * Internal dependencies
 */
import { select, subscribe } from 'googlesitekit-data';
import { watchBlocks } from './watch-blocks';
import * as tracking from '../../util/tracking';
import { VIEW_CONTEXT_WP_BLOCK_EDITOR } from '../constants';

jest.mock( 'googlesitekit-data', () => ( {
	select: jest.fn(),
	subscribe: jest.fn(),
} ) );

jest.mock( './get-blocks-titles', () => ( {
	getBlocksTitles: jest.fn( () =>
		jest.fn( ( name ) => {
			const titles = {
				'google-site-kit/rrm-subscribe-with-google':
					'Subscribe with Google',
				'google-site-kit/rrm-contribute-with-google':
					'Contribute with Google',
			};
			return titles[ name ];
		} )
	),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'watchBlocks', () => {
	let mockSelectReturnValue;
	let subscribeCallback;

	beforeEach( () => {
		jest.clearAllMocks();
		mockTrackEvent.mockClear();

		mockSelectReturnValue = {
			getBlocks: jest.fn(),
			isBlockSelected: jest.fn(),
		};

		select.mockImplementation( ( store ) => {
			if ( store === 'core/block-editor' ) {
				return mockSelectReturnValue;
			}
			return {};
		} );

		subscribe.mockImplementation( ( callback ) => {
			subscribeCallback = callback;
			return jest.fn();
		} );
	} );

	it( 'should track block insertion when a new tracked block is added and selected', () => {
		const blocksToTrack = [
			'google-site-kit/rrm-subscribe-with-google',
			'google-site-kit/rrm-contribute-with-google',
		];

		mockSelectReturnValue.getBlocks.mockReturnValue( [] );

		watchBlocks( blocksToTrack );

		expect( subscribe ).toHaveBeenCalledTimes( 1 );

		const newBlock = {
			clientId: 'block-123',
			name: 'google-site-kit/rrm-subscribe-with-google',
		};

		mockSelectReturnValue.getBlocks.mockReturnValue( [ newBlock ] );
		mockSelectReturnValue.isBlockSelected.mockReturnValue( true );

		subscribeCallback();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_WP_BLOCK_EDITOR }_rrm`,
			'insert_block',
			'Subscribe with Google'
		);
	} );

	it( 'should not track blocks that are not in the tracking list', () => {
		const blocksToTrack = [ 'google-site-kit/rrm-subscribe-with-google' ];

		mockSelectReturnValue.getBlocks.mockReturnValue( [] );

		watchBlocks( blocksToTrack );

		const newBlock = {
			clientId: 'block-456',
			name: 'core/paragraph',
		};

		mockSelectReturnValue.getBlocks.mockReturnValue( [ newBlock ] );
		mockSelectReturnValue.isBlockSelected.mockReturnValue( true );

		subscribeCallback();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should not track blocks that were already present on initialization', () => {
		const blocksToTrack = [ 'google-site-kit/rrm-subscribe-with-google' ];

		const existingBlock = {
			clientId: 'block-existing',
			name: 'google-site-kit/rrm-subscribe-with-google',
		};

		mockSelectReturnValue.getBlocks.mockReturnValue( [ existingBlock ] );

		watchBlocks( blocksToTrack );

		mockSelectReturnValue.isBlockSelected.mockReturnValue( true );

		subscribeCallback();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should not track blocks that are not selected', () => {
		const blocksToTrack = [ 'google-site-kit/rrm-subscribe-with-google' ];

		mockSelectReturnValue.getBlocks.mockReturnValue( [] );

		watchBlocks( blocksToTrack );

		const newBlock = {
			clientId: 'block-789',
			name: 'google-site-kit/rrm-subscribe-with-google',
		};

		mockSelectReturnValue.getBlocks.mockReturnValue( [ newBlock ] );
		mockSelectReturnValue.isBlockSelected.mockReturnValue( false );

		subscribeCallback();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should track each block only once', () => {
		const blocksToTrack = [ 'google-site-kit/rrm-subscribe-with-google' ];

		mockSelectReturnValue.getBlocks.mockReturnValue( [] );

		watchBlocks( blocksToTrack );

		const newBlock = {
			clientId: 'block-once',
			name: 'google-site-kit/rrm-subscribe-with-google',
		};

		mockSelectReturnValue.getBlocks.mockReturnValue( [ newBlock ] );
		mockSelectReturnValue.isBlockSelected.mockReturnValue( true );

		subscribeCallback();
		subscribeCallback();
		subscribeCallback();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should handle multiple tracked blocks being added', () => {
		const blocksToTrack = [
			'google-site-kit/rrm-subscribe-with-google',
			'google-site-kit/rrm-contribute-with-google',
		];

		mockSelectReturnValue.getBlocks.mockReturnValue( [] );

		watchBlocks( blocksToTrack );

		const block1 = {
			clientId: 'block-multi-1',
			name: 'google-site-kit/rrm-subscribe-with-google',
		};

		mockSelectReturnValue.getBlocks.mockReturnValue( [ block1 ] );
		mockSelectReturnValue.isBlockSelected.mockImplementation(
			( blockId ) => {
				return blockId === 'block-multi-1';
			}
		);

		subscribeCallback();

		const block2 = {
			clientId: 'block-multi-2',
			name: 'google-site-kit/rrm-contribute-with-google',
		};

		mockSelectReturnValue.getBlocks.mockReturnValue( [ block1, block2 ] );
		mockSelectReturnValue.isBlockSelected.mockImplementation(
			( blockId ) => {
				return blockId === 'block-multi-2';
			}
		);

		subscribeCallback();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_WP_BLOCK_EDITOR }_rrm`,
			'insert_block',
			'Subscribe with Google'
		);

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_WP_BLOCK_EDITOR }_rrm`,
			'insert_block',
			'Contribute with Google'
		);
	} );
} );
