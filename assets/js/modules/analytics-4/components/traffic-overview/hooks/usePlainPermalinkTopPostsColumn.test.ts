/**
 * Traffic Overview `usePlainPermalinkTopPostsColumn` hook tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getPlainPermalinkTopPostsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	createBreakdownReport,
	forDimensions,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import { createWaitForRegistry, provideSiteInfo } from '@tests/js/utils';
import { usePlainPermalinkTopPostsColumn } from './usePlainPermalinkTopPostsColumn';

describe( 'usePlainPermalinkTopPostsColumn', () => {
	let registry: WPDataRegistry;

	const postsRequest = forDimensions( 'pagePathPlusQueryString' );

	const postsByPagePathEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/posts-by-page-path'
	);

	// The site had 60 views, and post `1` had 40 of them, through two URLs.
	const postsReport = createBreakdownReport(
		[
			[ '/?p=1', 30 ],
			[ '/?product=hoodie', 12 ],
			[ '/?p=1&utm_source=newsletter', 10 ],
			[ '/?s=hats', 8 ],
		],
		60
	);

	const postsByPagePath = {
		'/?p=1': {
			id: 1,
			postType: 'post',
			title: 'Hello world!',
			url: 'http://example.com/?p=1',
		},
		'/?product=hoodie': {
			id: 5,
			postType: 'product',
			title: 'Hoodie',
			url: 'http://example.com/?product=hoodie',
		},
		'/?s=hats': null,
	};

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry, { usingPlainPermalinks: true } );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	} );

	it( "should return one row for each post, with its title and its permalink, and the report's total", async () => {
		fetchMock.getOnce( postsRequest, { body: postsReport, status: 200 } );
		fetchMock.getOnce( postsByPagePathEndpoint, {
			body: postsByPagePath,
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				usePlainPermalinkTopPostsColumn(
					getPlainPermalinkTopPostsReportOptions,
					null
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toMatchObject( {
			rows: [
				{
					label: 'Hello world!',
					value: '40',
					secondaryValue: '(66.7%)',
					url: 'http://example.com/?p=1',
				},
				{
					label: 'Hoodie',
					value: '12',
					secondaryValue: '(20.0%)',
					url: 'http://example.com/?product=hoodie',
				},
			],
			total: 60,
			loading: false,
			error: undefined,
		} );
	} );

	it( 'should leave out the posts of the excluded post type', async () => {
		fetchMock.getOnce( postsRequest, { body: postsReport, status: 200 } );
		fetchMock.getOnce( postsByPagePathEndpoint, {
			body: postsByPagePath,
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				usePlainPermalinkTopPostsColumn(
					getPlainPermalinkTopPostsReportOptions,
					'product'
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{
				label: 'Hello world!',
				value: '40',
				secondaryValue: '(66.7%)',
				url: 'http://example.com/?p=1',
			},
		] );
	} );

	it( 'should request the report again, rather than the posts, when `retry` is called after the report fails', async () => {
		fetchMock.getOnce( postsRequest, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );
		fetchMock.getOnce( postsRequest, { body: postsReport, status: 200 } );
		fetchMock.getOnce( postsByPagePathEndpoint, {
			body: postsByPagePath,
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				usePlainPermalinkTopPostsColumn(
					getPlainPermalinkTopPostsReportOptions,
					null
				),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toMatchObject( {
			rows: [],
			loading: false,
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );

		const waitForRetry = createWaitForRegistry( registry );

		act( () => {
			result.current.retry();
		} );

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, postsRequest );
		expect( fetchMock ).toHaveFetchedTimes( 1, postsByPagePathEndpoint );
		expect( result.current ).toMatchObject( {
			loading: false,
			error: undefined,
		} );
	} );
} );
