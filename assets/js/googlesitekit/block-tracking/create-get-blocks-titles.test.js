/**
 * Tests for createGetBlockTitle.
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

/**
 * Internal dependencies
 */
import { select, subscribe } from 'googlesitekit-data';
import { createGetBlockTitle } from './create-get-blocks-titles';
import {
	CONTRIBUTE_WITH_GOOGLE_BLOCK,
	SUBSCRIBE_WITH_GOOGLE_BLOCK,
} from '@/blocks/reader-revenue-manager/common/constants';

vi.mock( 'googlesitekit-data', () => ( {
	select: vi.fn(),
	subscribe: vi.fn(),
} ) );

describe( 'getBlocksTitles', () => {
	let mockSelectReturnValue;
	let subscribeCallback;
	let unsubscribeMock;

	beforeEach( () => {
		vi.clearAllMocks();

		unsubscribeMock = vi.fn();

		mockSelectReturnValue = {
			getInserterItems: vi.fn(),
		};
		select.mockImplementation( ( store ) => {
			if ( store === 'core/block-editor' ) {
				return mockSelectReturnValue;
			}
			return {};
		} );

		subscribe.mockImplementation( ( callback ) => {
			subscribeCallback = callback;
			return unsubscribeMock;
		} );
	} );

	it( 'should return a function that retrieves block titles', () => {
		const blocks = [ SUBSCRIBE_WITH_GOOGLE_BLOCK ];

		mockSelectReturnValue.getInserterItems.mockReturnValue( [
			{
				id: SUBSCRIBE_WITH_GOOGLE_BLOCK,
				title: 'Subscribe with Google',
			},
			{
				id: 'core/paragraph',
				title: 'Paragraph',
			},
		] );

		const getBlockTitle = createGetBlockTitle( blocks );

		expect( subscribe ).toHaveBeenCalledTimes( 1 );

		subscribeCallback();

		expect( getBlockTitle( SUBSCRIBE_WITH_GOOGLE_BLOCK ) ).toBe(
			'Subscribe with Google'
		);
		expect( getBlockTitle( 'core/paragraph' ) ).toBeUndefined();
		expect( getBlockTitle( 'non-existent-block' ) ).toBeUndefined();
	} );

	it( 'should filter inserter items to only requested blocks', () => {
		const blocks = [
			SUBSCRIBE_WITH_GOOGLE_BLOCK,
			CONTRIBUTE_WITH_GOOGLE_BLOCK,
		];

		mockSelectReturnValue.getInserterItems.mockReturnValue( [
			{
				id: SUBSCRIBE_WITH_GOOGLE_BLOCK,
				title: 'Subscribe with Google',
			},
			{
				id: 'core/paragraph',
				title: 'Paragraph',
			},
			{
				id: CONTRIBUTE_WITH_GOOGLE_BLOCK,
				title: 'Contribute with Google',
			},
			{
				id: 'core/heading',
				title: 'Heading',
			},
		] );

		const getBlockTitle = createGetBlockTitle( blocks );

		subscribeCallback();

		expect( getBlockTitle( SUBSCRIBE_WITH_GOOGLE_BLOCK ) ).toBe(
			'Subscribe with Google'
		);
		expect( getBlockTitle( CONTRIBUTE_WITH_GOOGLE_BLOCK ) ).toBe(
			'Contribute with Google'
		);
		expect( getBlockTitle( 'core/paragraph' ) ).toBeUndefined();
		expect( getBlockTitle( 'core/heading' ) ).toBeUndefined();
	} );

	it( 'should unsubscribe once all requested block titles are found', () => {
		const blocks = [
			SUBSCRIBE_WITH_GOOGLE_BLOCK,
			CONTRIBUTE_WITH_GOOGLE_BLOCK,
		];

		mockSelectReturnValue.getInserterItems.mockReturnValueOnce( [
			{
				id: SUBSCRIBE_WITH_GOOGLE_BLOCK,
				title: 'Subscribe with Google',
			},
		] );

		createGetBlockTitle( blocks );

		subscribeCallback();

		expect( unsubscribeMock ).not.toHaveBeenCalled();

		mockSelectReturnValue.getInserterItems.mockReturnValueOnce( [
			{
				id: SUBSCRIBE_WITH_GOOGLE_BLOCK,
				title: 'Subscribe with Google',
			},
			{
				id: CONTRIBUTE_WITH_GOOGLE_BLOCK,
				title: 'Contribute with Google',
			},
		] );

		subscribeCallback();

		expect( unsubscribeMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should handle an empty blocks array', () => {
		const blocks = [];

		mockSelectReturnValue.getInserterItems.mockReturnValue( [
			{
				id: SUBSCRIBE_WITH_GOOGLE_BLOCK,
				title: 'Subscribe with Google',
			},
		] );

		const getBlockTitle = createGetBlockTitle( blocks );

		subscribeCallback();

		expect( unsubscribeMock ).toHaveBeenCalledTimes( 1 );

		expect( getBlockTitle( SUBSCRIBE_WITH_GOOGLE_BLOCK ) ).toBeUndefined();
	} );

	it( 'should maintain its block titles map across multiple subscription callbacks', () => {
		const blocks = [
			SUBSCRIBE_WITH_GOOGLE_BLOCK,
			CONTRIBUTE_WITH_GOOGLE_BLOCK,
		];

		mockSelectReturnValue.getInserterItems.mockReturnValueOnce( [
			{
				id: SUBSCRIBE_WITH_GOOGLE_BLOCK,
				title: 'Subscribe with Google',
			},
		] );

		const getBlockTitle = createGetBlockTitle( blocks );

		subscribeCallback();

		expect( getBlockTitle( SUBSCRIBE_WITH_GOOGLE_BLOCK ) ).toBe(
			'Subscribe with Google'
		);

		mockSelectReturnValue.getInserterItems.mockReturnValueOnce( [
			{
				id: SUBSCRIBE_WITH_GOOGLE_BLOCK,
				title: 'Subscribe with Google',
			},
			{
				id: CONTRIBUTE_WITH_GOOGLE_BLOCK,
				title: 'Contribute with Google',
			},
		] );

		subscribeCallback();

		expect( getBlockTitle( SUBSCRIBE_WITH_GOOGLE_BLOCK ) ).toBe(
			'Subscribe with Google'
		);
		expect( getBlockTitle( CONTRIBUTE_WITH_GOOGLE_BLOCK ) ).toBe(
			'Contribute with Google'
		);
	} );
} );
