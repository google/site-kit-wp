/**
 * Tests for getBlocksTitles.
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
import { getBlocksTitles } from './get-blocks-titles';

jest.mock( 'googlesitekit-data', () => ( {
	select: jest.fn(),
	subscribe: jest.fn(),
} ) );

describe( 'getBlocksTitles', () => {
	let mockSelectReturnValue;
	let subscribeCallback;
	let unsubscribeMock;

	beforeEach( () => {
		jest.clearAllMocks();

		unsubscribeMock = jest.fn();

		mockSelectReturnValue = {
			getInserterItems: jest.fn(),
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
		const blocks = [ 'google-site-kit/rrm-subscribe-with-google' ];

		mockSelectReturnValue.getInserterItems.mockReturnValue( [
			{
				id: 'google-site-kit/rrm-subscribe-with-google',
				title: 'Subscribe with Google',
			},
			{
				id: 'core/paragraph',
				title: 'Paragraph',
			},
		] );

		const getBlockTitle = getBlocksTitles( blocks );

		expect( subscribe ).toHaveBeenCalledTimes( 1 );

		subscribeCallback();

		expect(
			getBlockTitle( 'google-site-kit/rrm-subscribe-with-google' )
		).toBe( 'Subscribe with Google' );
		expect( getBlockTitle( 'core/paragraph' ) ).toBeUndefined();
		expect( getBlockTitle( 'non-existent-block' ) ).toBeUndefined();
	} );

	it( 'should filter inserter items to only requested blocks', () => {
		const blocks = [
			'google-site-kit/rrm-subscribe-with-google',
			'google-site-kit/rrm-contribute-with-google',
		];

		mockSelectReturnValue.getInserterItems.mockReturnValue( [
			{
				id: 'google-site-kit/rrm-subscribe-with-google',
				title: 'Subscribe with Google',
			},
			{
				id: 'core/paragraph',
				title: 'Paragraph',
			},
			{
				id: 'google-site-kit/rrm-contribute-with-google',
				title: 'Contribute with Google',
			},
			{
				id: 'core/heading',
				title: 'Heading',
			},
		] );

		const getBlockTitle = getBlocksTitles( blocks );

		subscribeCallback();

		expect(
			getBlockTitle( 'google-site-kit/rrm-subscribe-with-google' )
		).toBe( 'Subscribe with Google' );
		expect(
			getBlockTitle( 'google-site-kit/rrm-contribute-with-google' )
		).toBe( 'Contribute with Google' );
		expect( getBlockTitle( 'core/paragraph' ) ).toBeUndefined();
		expect( getBlockTitle( 'core/heading' ) ).toBeUndefined();
	} );

	it( 'should unsubscribe once all requested block titles are found', () => {
		const blocks = [
			'google-site-kit/rrm-subscribe-with-google',
			'google-site-kit/rrm-contribute-with-google',
		];

		mockSelectReturnValue.getInserterItems.mockReturnValueOnce( [
			{
				id: 'google-site-kit/rrm-subscribe-with-google',
				title: 'Subscribe with Google',
			},
		] );

		getBlocksTitles( blocks );

		subscribeCallback();

		expect( unsubscribeMock ).not.toHaveBeenCalled();

		mockSelectReturnValue.getInserterItems.mockReturnValueOnce( [
			{
				id: 'google-site-kit/rrm-subscribe-with-google',
				title: 'Subscribe with Google',
			},
			{
				id: 'google-site-kit/rrm-contribute-with-google',
				title: 'Contribute with Google',
			},
		] );

		subscribeCallback();

		expect( unsubscribeMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should handle empty blocks array', () => {
		const blocks = [];

		mockSelectReturnValue.getInserterItems.mockReturnValue( [
			{
				id: 'google-site-kit/rrm-subscribe-with-google',
				title: 'Subscribe with Google',
			},
		] );

		const getBlockTitle = getBlocksTitles( blocks );

		subscribeCallback();

		expect( unsubscribeMock ).toHaveBeenCalledTimes( 1 );

		expect(
			getBlockTitle( 'google-site-kit/rrm-subscribe-with-google' )
		).toBeUndefined();
	} );

	it( 'should maintain block titles map across multiple subscription callbacks', () => {
		const blocks = [
			'google-site-kit/rrm-subscribe-with-google',
			'google-site-kit/rrm-contribute-with-google',
		];

		mockSelectReturnValue.getInserterItems.mockReturnValueOnce( [
			{
				id: 'google-site-kit/rrm-subscribe-with-google',
				title: 'Subscribe with Google',
			},
		] );

		const getBlockTitle = getBlocksTitles( blocks );

		subscribeCallback();

		expect(
			getBlockTitle( 'google-site-kit/rrm-subscribe-with-google' )
		).toBe( 'Subscribe with Google' );

		mockSelectReturnValue.getInserterItems.mockReturnValueOnce( [
			{
				id: 'google-site-kit/rrm-subscribe-with-google',
				title: 'Subscribe with Google',
			},
			{
				id: 'google-site-kit/rrm-contribute-with-google',
				title: 'Contribute with Google',
			},
		] );

		subscribeCallback();

		expect(
			getBlockTitle( 'google-site-kit/rrm-subscribe-with-google' )
		).toBe( 'Subscribe with Google' );
		expect(
			getBlockTitle( 'google-site-kit/rrm-contribute-with-google' )
		).toBe( 'Contribute with Google' );
	} );
} );
