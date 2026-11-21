/**
 * Traffic Overview chart's published post tooltip tests.
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
 * External dependencies
 */
import { createRef } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { act, fireEvent, render } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import PublishedPostTooltip, {
	PUBLISHED_POST_TOOLTIP_HIDE_DELAY,
	PublishedPostTooltipDay,
	PublishedPostTooltipHandle,
} from './PublishedPostTooltip';

describe( 'PublishedPostTooltip', () => {
	let registry: WPDataRegistry;

	const day: PublishedPostTooltipDay = {
		date: new Date( 2025, 0, 15 ),
		posts: [
			{
				date: '2025-01-15',
				title: 'Ice cream is good for your health',
				url: 'http://example.com/ice-cream/',
			},
		],
		x: 120,
		y: 80,
	};

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	/**
	 * Renders the tooltip, closed, and returns its handle.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The render result, and the tooltip's handle.
	 */
	function renderTooltip() {
		const ref = createRef< PublishedPostTooltipHandle >();
		const result = render( <PublishedPostTooltip ref={ ref } />, {
			registry,
		} );

		return { ...result, tooltip: ref };
	}

	/**
	 * Finds the open tooltip.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} container The element the tooltip rendered into.
	 * @return {Element|null} The tooltip, or `null` when it's closed.
	 */
	function getTooltip( container: Element ): Element | null {
		return container.querySelector(
			'.googlesitekit-traffic-overview__post-tooltip'
		);
	}

	it( 'should render nothing until a day is shown', () => {
		const { container } = renderTooltip();

		expect( getTooltip( container ) ).toBeNull();
	} );

	it( "should show the post's title, the day it was published, and a link to the Site Kit dashboard for it", () => {
		const { getByText, getByRole, tooltip } = renderTooltip();

		act( () => tooltip.current?.show( day ) );

		expect(
			getByText( 'Ice cream is good for your health' )
		).toBeInTheDocument();
		expect( getByText( 'posted Jan 15' ) ).toBeInTheDocument();
		expect( getByRole( 'link', { name: 'See more' } ) ).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=http%3A%2F%2Fexample.com%2Fice-cream%2F'
		);
	} );

	it( "should put the tip of the caret on the edge of the day's dot", () => {
		const { container, tooltip } = renderTooltip();

		act( () => tooltip.current?.show( day ) );

		// The dot's radius and its white edge make 11px.
		expect( getTooltip( container ) ).toHaveStyle( {
			left: '120px',
			top: '69px',
		} );
	} );

	it( 'should show each post published on the day, with a link only for a post with a URL', () => {
		const { getAllByText, getByText, getAllByRole, tooltip } =
			renderTooltip();

		act( () =>
			tooltip.current?.show( {
				...day,
				posts: [
					...day.posts,
					{ date: '2025-01-15', title: 'Eat ice cream every day' },
				],
			} )
		);

		expect(
			getByText( 'Ice cream is good for your health' )
		).toBeInTheDocument();
		expect( getByText( 'Eat ice cream every day' ) ).toBeInTheDocument();
		expect( getAllByText( 'posted Jan 15' ) ).toHaveLength( 2 );
		expect( getAllByRole( 'link', { name: 'See more' } ) ).toHaveLength(
			1
		);
	} );

	it( 'should stay open for a moment after it is hidden, then close', () => {
		jest.useFakeTimers();

		const { container, tooltip } = renderTooltip();

		act( () => tooltip.current?.show( day ) );
		act( () => tooltip.current?.hide() );
		act( () => {
			jest.advanceTimersByTime( PUBLISHED_POST_TOOLTIP_HIDE_DELAY - 1 );
		} );

		expect( getTooltip( container ) ).toBeInTheDocument();

		act( () => {
			jest.advanceTimersByTime( 1 );
		} );

		expect( getTooltip( container ) ).toBeNull();
	} );

	it( 'should stay open while the pointer is on it, and close once the pointer leaves it', () => {
		jest.useFakeTimers();

		const { container, tooltip } = renderTooltip();

		act( () => tooltip.current?.show( day ) );
		act( () => tooltip.current?.hide() );

		fireEvent.mouseEnter( getTooltip( container ) as Element );

		act( () => {
			jest.advanceTimersByTime( PUBLISHED_POST_TOOLTIP_HIDE_DELAY );
		} );

		expect( getTooltip( container ) ).toBeInTheDocument();

		fireEvent.mouseLeave( getTooltip( container ) as Element );

		act( () => {
			jest.advanceTimersByTime( PUBLISHED_POST_TOOLTIP_HIDE_DELAY );
		} );

		expect( getTooltip( container ) ).toBeNull();
	} );

	it( 'should stay open when another day with posts is shown before it closes', () => {
		jest.useFakeTimers();

		const { container, getByText, tooltip } = renderTooltip();

		act( () => tooltip.current?.show( day ) );
		act( () => tooltip.current?.hide() );
		act( () =>
			tooltip.current?.show( {
				date: new Date( 2025, 0, 16 ),
				posts: [
					{ date: '2025-01-16', title: 'Eat ice cream every day' },
				],
				x: 160,
				y: 60,
			} )
		);
		act( () => {
			jest.advanceTimersByTime( PUBLISHED_POST_TOOLTIP_HIDE_DELAY );
		} );

		expect( getTooltip( container ) ).toBeInTheDocument();
		expect( getByText( 'Eat ice cream every day' ) ).toBeInTheDocument();
		expect( getByText( 'posted Jan 16' ) ).toBeInTheDocument();
	} );
} );
