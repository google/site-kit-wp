/**
 * Traffic Overview chart's published post tooltip.
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
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import {
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { PublishedPost } from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { getLocale } from '@/js/util';
import ChartTooltipCaret from '@/svg/icons/chart-tooltip-caret.svg';

export interface PublishedPostTooltipDay {
	/** The day the posts were published. */
	date: Date;
	/** The posts published on the day. */
	posts: PublishedPost[];
	/** How far the middle of the day's dot is from the left edge of the chart, in pixels. */
	x: number;
	/** How far the middle of the day's dot is from the top edge of the chart, in pixels. */
	y: number;
}

export interface PublishedPostTooltipHandle {
	/** Opens the tooltip over the dot of a day with published posts. */
	show: ( day: PublishedPostTooltipDay ) => void;
	/** Closes the tooltip after a short delay, unless the pointer moves onto it first. */
	hide: () => void;
}

/**
 * How long the tooltip stays open after the pointer leaves its day, in
 * milliseconds. The pointer crosses other days on its way to the tooltip's
 * links, so the tooltip waits for it.
 */
export const PUBLISHED_POST_TOOLTIP_HIDE_DELAY = 300;

/**
 * The distance from the middle of a post's dot to the tip of the caret: the
 * dot's 8px radius and its 3px white edge.
 */
const DOT_RADIUS = 11;

const PublishedPostTooltip = forwardRef< PublishedPostTooltipHandle >(
	( _props, ref ) => {
		const [ day, setDay ] = useState< PublishedPostTooltipDay | null >(
			null
		);
		// How far the card moves sideways from the middle of the dot to stay
		// inside the chart, in pixels. The caret moves back by as much, so it
		// still points at the dot.
		const [ shift, setShift ] = useState( 0 );

		const tooltipRef = useRef< HTMLDivElement >( null );
		const hideTimeoutRef = useRef< ReturnType< typeof setTimeout > >();

		const cancelHide = useCallback( () => {
			clearTimeout( hideTimeoutRef.current );
		}, [] );

		const hide = useCallback( () => {
			clearTimeout( hideTimeoutRef.current );
			hideTimeoutRef.current = setTimeout(
				() => setDay( null ),
				PUBLISHED_POST_TOOLTIP_HIDE_DELAY
			);
		}, [] );

		useImperativeHandle(
			ref,
			() => ( {
				show( nextDay ) {
					cancelHide();
					setDay( nextDay );
				},
				hide,
			} ),
			[ cancelHide, hide ]
		);

		// A close still pending when the chart goes away is dropped.
		useEffect( () => cancelHide, [ cancelHide ] );

		useLayoutEffect( () => {
			const tooltip = tooltipRef.current;
			const chart = tooltip?.offsetParent;

			if ( ! day || ! tooltip || ! chart ) {
				return;
			}

			const left = day.x - tooltip.offsetWidth / 2;

			setShift(
				clamp( left, 0, chart.clientWidth - tooltip.offsetWidth ) - left
			);
		}, [ day ] );

		const detailsURLs = useSelect(
			( select: Select ) =>
				day?.posts.map( ( { url } ) =>
					url
						? select( CORE_SITE ).getAdminURL(
								'googlesitekit-dashboard',
								{ permaLink: url }
						  )
						: undefined
				),
			[ day ]
		);

		const dateFormatter = useMemo(
			() =>
				new Intl.DateTimeFormat( getLocale(), {
					month: 'short',
					day: 'numeric',
				} ),
			[]
		);

		if ( ! day ) {
			return null;
		}

		const postedOn = sprintf(
			/* translators: %s: the day a post was published, such as "Apr 27" */
			__( 'posted %s', 'google-site-kit' ),
			dateFormatter.format( day.date )
		);

		return (
			<div
				ref={ tooltipRef }
				className="googlesitekit-traffic-overview__post-tooltip"
				style={ { left: day.x + shift, top: day.y - DOT_RADIUS } }
				onMouseEnter={ cancelHide }
				onMouseLeave={ hide }
			>
				<div className="googlesitekit-traffic-overview__post-tooltip-card">
					{ day.posts.map( ( { title }, index ) => (
						// Keyed by position: two posts on one day can share a
						// title, and nothing here reorders them.
						<div
							key={ index }
							className="googlesitekit-traffic-overview__post-tooltip-post"
						>
							<Typography
								as="p"
								type={ TYPE_LABEL }
								size={ SIZE_SMALL }
								className="googlesitekit-traffic-overview__post-tooltip-title"
							>
								{ title }
							</Typography>
							<Typography
								as="p"
								type={ TYPE_BODY }
								size={ SIZE_SMALL }
								className="googlesitekit-traffic-overview__post-tooltip-date"
							>
								{ postedOn }
							</Typography>
							{ detailsURLs?.[ index ] && (
								<Link
									className="googlesitekit-traffic-overview__post-tooltip-link"
									href={ detailsURLs[ index ] }
								>
									{ __( 'See more', 'google-site-kit' ) }
								</Link>
							) }
						</div>
					) ) }
				</div>
				<div
					className="googlesitekit-traffic-overview__post-tooltip-caret"
					style={ { transform: `translateX(${ -shift }px)` } }
				>
					<ChartTooltipCaret width={ 13 } height={ 7 } />
				</div>
			</div>
		);
	}
);

export default PublishedPostTooltip;
