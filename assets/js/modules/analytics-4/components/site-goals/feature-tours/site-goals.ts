/**
 * Site Goals feature tour.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
	AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
} from '@/js/googlesitekit/widgets/default-areas';

export const SITE_GOALS_TOUR = 'site-goals-feature-tour';

/**
 * The first element the tour points to. The modal waits for it before it
 * shows. The tour waits for it before it starts.
 */
const FIRST_STEP_TARGET = '.googlesitekit-site-goals-primary-action';

/**
 * The widget areas at and above the Site Goals section, in the order they
 * appear on the page. Normally an area loads its data only when the user
 * scrolls to it. The tour loads all of these before it starts, so the page
 * reaches its full height first. Without this, an area that loads later would
 * push the Site Goals section down, and the tour would point at the wrong
 * place. Loading an area the site does not have has no effect.
 */
export const SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS = [
	AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY,
];

/**
 * The CSS class of the gray placeholder a widget shows while it loads its
 * data, rendered by `PreviewBlock`. The wait below looks for this class to
 * tell when a widget area is still loading, so keep it in sync if
 * `PreviewBlock` renames the class.
 */
const LOADING_PLACEHOLDER_CLASS = 'googlesitekit-preview-block';

/**
 * The CSS class on a widget area's container, rendered by `WidgetAreaRenderer`.
 * Each area also carries a `--<slug>` suffix, so the wait can look at one area
 * at a time. Keep it in sync if `WidgetAreaRenderer` renames the class.
 */
const WIDGET_AREA_CLASS = 'googlesitekit-widget-area';

/**
 * How often the wait checks the page (250 milliseconds), and the longest it
 * runs before it gives up (30 seconds). The limit stops a section that never
 * loads from blocking the modal or the tour.
 */
const SECTION_READY_CHECK_INTERVAL_MS = 250;
const SECTION_READY_CHECK_MAX_TOTAL_WAIT_MS = 30000;

/**
 * Waits until the Site Goals section has loaded and its layout has settled.
 *
 * The tour draws a spotlight around its target and redraws it on every
 * layout shift. The widget areas above and including Site Goals shift the
 * layout as their data loads, so the tour must wait for them, or the
 * spotlight lands in the wrong place. The wait ends once those areas have
 * loaded and the layout settles, or after 30 seconds, so a section that
 * never loads cannot block the modal or the tour.
 *
 * @since 1.181.0
 * @since n.e.x.t Renamed from `checkSiteGoalsTourRequirements`, exported it, and made it wait for the widget areas above Site Goals to load and the layout to settle before the tour starts.
 *
 * @param signal Optional `AbortSignal` to stop the wait. The hook passes one so it can cancel on unmount. The tour passes the data registry through `checkRequirements`, which is not a signal, so the wait ignores it.
 * @return Promise that resolves to `true` when the section is ready or the wait gives up, or `false` when the signal aborts.
 */
export function waitForSiteGoalsSectionReady(
	signal?: AbortSignal
): Promise< boolean > {
	return new Promise( ( resolve ) => {
		let remainingWaitMs = SECTION_READY_CHECK_MAX_TOTAL_WAIT_MS;
		let previousTargetTop: number | undefined;
		let timeoutID: ReturnType< typeof setTimeout >;

		function checkSection() {
			if ( signal?.aborted ) {
				resolve( false );
				return;
			}

			const target = global.document.querySelector( FIRST_STEP_TARGET );
			const targetTop = target?.getBoundingClientRect().top;

			// Check whether any widget area the tour loads still shows a
			// placeholder. A placeholder means the data has not arrived, so the
			// layout can still shift.
			const isPreloadAreaLoading =
				SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS.some( ( slug ) =>
					global.document.querySelector(
						`.${ WIDGET_AREA_CLASS }--${ slug } .${ LOADING_PLACEHOLDER_CLASS }`
					)
				);

			// The section is ready when all three are true: no placeholder is
			// left, the target is on the page, and its top position matches the
			// last check. The layout has settled, so the tour can start and its
			// spotlight will not jump.
			if (
				( target &&
					! isPreloadAreaLoading &&
					targetTop === previousTargetTop ) ||
				remainingWaitMs <= 0
			) {
				resolve( true );
				return;
			}

			previousTargetTop = targetTop;
			remainingWaitMs -= SECTION_READY_CHECK_INTERVAL_MS;
			timeoutID = global.setTimeout(
				checkSection,
				SECTION_READY_CHECK_INTERVAL_MS
			);
		}

		// The hook passes an `AbortSignal` so it can stop the loop when its
		// component unmounts. The tour passes the data registry here through
		// `checkRequirements`, which is not a signal, so only listen for a
		// real `AbortSignal`.
		if ( signal instanceof AbortSignal ) {
			signal.addEventListener( 'abort', () => {
				global.clearTimeout( timeoutID );
				resolve( false );
			} );
		}

		checkSection();
	} );
}

const defaultStepOptions = {
	offset: -2,
	spotlightPadding: 0,
	styles: {
		spotlight: {
			boxSizing: 'content-box',
			paddingTop: '24px',
			paddingBottom: '24px',
			paddingInlineEnd: '24px',
			marginTop: '-24px',
			marginInlineEnd: '-24px',
		},
	},
	placement: 'top' as const,
	isResponsive: true,
};

/**
 * Returns the Google Analytics event category for the Site Goals tour,
 * prefixed with the current view context.
 *
 * @since 1.181.0
 *
 * @param viewContext The current view context.
 * @return The event category string.
 */
function gaEventCategory( viewContext: string ) {
	return `${ viewContext }_site-goals-tour`;
}

/**
 * Returns the Site Goals tour config.
 *
 * The tour starts from the "Show me" button on the intro modal and runs on
 * the Site Goals widget. It loads the widget areas above and including Site
 * Goals and waits for the layout to settle before it starts, through
 * `preloadWidgetAreas` and `checkRequirements`.
 *
 * The breakdown notice step is included only when `hasBreakdownNotice` is
 * true, since that step points at a notice that is not always on the page.
 *
 * @since 1.181.0
 * @since n.e.x.t Load every widget area above and including the Site Goals section before the tour starts, and wait for them to load and the layout to settle.
 *
 * @param params                    Tour params.
 * @param params.isEcommerceOnly    True when only ecommerce events are detected. Picks the breakdown step copy.
 * @param params.hasBreakdownNotice True when the breakdown notice is shown, so its tour step has a target to point to.
 * @return The Site Goals tour config.
 */
export function getSiteGoalsTour( {
	isEcommerceOnly,
	hasBreakdownNotice,
}: {
	isEcommerceOnly: boolean;
	hasBreakdownNotice: boolean;
} ) {
	const breakdownStep = {
		...defaultStepOptions,
		target: '.googlesitekit-site-goals-breakdown-notice',
		title: __( 'Get into the details', 'google-site-kit' ),
		content: isEcommerceOnly
			? __(
					'Want to see whether WooCommerce or Easy Digital Downloads is driving more success? You can break these numbers down to see the performance of each plugin.',
					'google-site-kit'
			  )
			: __(
					'Want to know which specific form is bringing in the most interest? You can break these numbers down to see the performance of each individual form on your site.',
					'google-site-kit'
			  ),
		styles: {
			spotlight: {
				...defaultStepOptions.styles.spotlight,
				paddingInlineStart: '24px',
				marginInlineStart: '-24px',
			},
		},
	};

	return {
		slug: SITE_GOALS_TOUR,
		isRepeatable: true,
		contexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		gaEventCategory,
		preloadWidgetAreas: SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS,
		checkRequirements: waitForSiteGoalsSectionReady,
		steps: [
			{
				...defaultStepOptions,
				target: FIRST_STEP_TARGET,
				title: __(
					'Your main goal is front and center',
					'google-site-kit'
				),
				content: __(
					'Track the most important metric (like sales or lead submissions) to understand how your site is helping you reach your goals.',
					'google-site-kit'
				),
			},
			...( hasBreakdownNotice ? [ breakdownStep ] : [] ),
			{
				...defaultStepOptions,
				target: '.googlesitekit-site-goals-goal-drivers-group',
				title: __( 'Find what drives success', 'google-site-kit' ),
				content: __(
					'Discover which traffic channels or locations are bringing in the best results, so you can focus on what works. Customize this list with metrics that matter the most to you.',
					'google-site-kit'
				),
				// Show "Done" on the last step's button instead of the
				// shared "Got it". react-joyride uses this label on this
				// step only and keeps the other labels.
				locale: {
					last: __( 'Done', 'google-site-kit' ),
				},
			},
		],
	};
}
