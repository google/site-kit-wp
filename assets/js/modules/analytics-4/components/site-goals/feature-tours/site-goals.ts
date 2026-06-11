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
import { AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';

export const SITE_GOALS_TOUR = 'site-goals-feature-tour';

// The first step's target. The tour waits for this element before it starts.
const FIRST_STEP_TARGET = '.googlesitekit-site-goals-primary-action';

// The widgets render the target only after their reports load. Look for
// the target every 250ms. Stop after five seconds, so a section that
// never loads cannot block the tour.
const TOUR_READY_CHECK_INTERVAL_MS = 250;
const TOUR_READY_CHECK_MAX_TOTAL_WAIT_MS = 5000;

/**
 * Waits until the Site Goals tour can start.
 *
 * react-joyride skips a step when its target is not on the page. A tour that
 * starts too early skips every step and shows nothing. This check lets the
 * tour start as soon as the first step's target renders. When the target is
 * slow, the wait ends after five seconds and the tour starts anyway, so the
 * wait never cancels the tour. `triggerOnDemandTour` waits for this check
 * before it starts the tour.
 *
 * @since 1.181.0
 *
 * @return Promise that always resolves to `true`, when the target renders or the wait ends.
 */
function checkSiteGoalsTourRequirements(): Promise< boolean > {
	return new Promise( ( resolve ) => {
		let remainingWaitMs = TOUR_READY_CHECK_MAX_TOTAL_WAIT_MS;

		function checkTarget() {
			if (
				global.document.querySelector( FIRST_STEP_TARGET ) ||
				remainingWaitMs <= 0
			) {
				resolve( true );
				return;
			}

			remainingWaitMs -= TOUR_READY_CHECK_INTERVAL_MS;
			global.setTimeout( checkTarget, TOUR_READY_CHECK_INTERVAL_MS );
		}

		checkTarget();
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
 * The tour starts when the user clicks "Show me" on the Site Goals intro modal
 * and runs on the Site Goals widget. The first step points at the key action
 * tile group and the last step points at the goal drivers. The last step's
 * button says "Done" instead of the shared "Got it". The tour waits for the
 * first step's target to render, five seconds at most, because react-joyride
 * skips a step when its target is missing. The breakdown notice step is
 * included only when `hasBreakdownNotice` is true, because that step targets
 * the notice and the notice is not always rendered. Its copy depends on
 * `isEcommerceOnly`: sales copy when `true`, leads copy when `false`.
 *
 * @since 1.181.0
 *
 * @param params                    Tour params.
 * @param params.isEcommerceOnly    True when only ecommerce events are detected. Picks the breakdown step copy.
 * @param params.hasBreakdownNotice True when the breakdown notice is rendered, so its tour step has a target.
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
		preloadWidgetAreas: [ AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY ],
		checkRequirements: checkSiteGoalsTourRequirements,
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
				// shared "Got it". react-joyride merges this over the tour
				// locale, so all other labels stay the same.
				locale: {
					last: __( 'Done', 'google-site-kit' ),
				},
			},
		],
	};
}
