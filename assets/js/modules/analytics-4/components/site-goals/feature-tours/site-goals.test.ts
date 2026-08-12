/**
 * Site Goals tour tests.
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
	SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS,
	getSiteGoalsTour,
	waitForSiteGoalsSectionReady,
} from './site-goals';

/**
 * Adds the element the tour points to first. The `afterEach` in the wait
 * tests removes it.
 *
 * @since 1.182.0
 *
 * @return The added element, so a test can mock its position.
 */
function appendTourTarget() {
	const target = document.createElement( 'div' );
	target.className = 'googlesitekit-site-goals-primary-action';
	document.body.appendChild( target );
	return target;
}

/**
 * Adds a widget area box, the way `WidgetAreaRenderer` makes one. The
 * `afterEach` in the wait tests removes it.
 *
 * @since 1.182.0
 *
 * @param slug The widget area slug.
 * @return The added widget area box.
 */
function appendPreloadArea( slug: string ) {
	const area = document.createElement( 'div' );
	area.className = `googlesitekit-widget-area--${ slug }`;
	document.body.appendChild( area );
	return area;
}

/**
 * Adds a gray placeholder inside an area, like the one a widget shows while
 * it loads.
 *
 * @since 1.182.0
 *
 * @param parent The area element to add the placeholder to.
 * @return The added placeholder element.
 */
function appendPlaceholder( parent: Element ) {
	const placeholder = document.createElement( 'div' );
	placeholder.className = 'googlesitekit-preview-block';
	parent.appendChild( placeholder );
	return placeholder;
}

const ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES = {
	hasEcommerceBreakdownNotice: true,
	hasLeadBreakdownNotice: true,
};
const ECOMMERCE_BREAKDOWN_NOTICE_ONLY = {
	hasEcommerceBreakdownNotice: true,
	hasLeadBreakdownNotice: false,
};
const LEAD_BREAKDOWN_NOTICE_ONLY = {
	hasEcommerceBreakdownNotice: false,
	hasLeadBreakdownNotice: true,
};
const NO_BREAKDOWN_NOTICES = {
	hasEcommerceBreakdownNotice: false,
	hasLeadBreakdownNotice: false,
};

const STORE_COPY = /WooCommerce or Easy Digital Downloads/;
const FORMS_COPY = /each individual form/;

describe( 'getSiteGoalsTour', () => {
	it( 'should return the Site Goals tour with the right slug', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.slug ).toBe( 'site-goals-feature-tour' );
	} );

	it( 'should be repeatable so the tour can start again on demand', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.isRepeatable ).toBe( true );
	} );

	it( 'should be scoped to the main dashboard', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.contexts ).toEqual( [ 'mainDashboard' ] );
	} );

	it( 'should set the widget areas to load, above and including Site Goals, in page order', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.preloadWidgetAreas ).toBe(
			SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS
		);
		expect( tour.preloadWidgetAreas ).toEqual( [
			'mainDashboardKeyMetricsPrimary',
			'mainDashboardTrafficPrimary',
			'mainDashboardTrafficAudienceSegmentation',
			'mainDashboardSiteGoalsPrimary',
		] );
	} );

	it( 'should wait for the Site Goals section before starting the tour', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.checkRequirements ).toBe( waitForSiteGoalsSectionReady );
	} );

	it( 'should prefix the Google Analytics event category with the current view context', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.gaEventCategory( 'test-context' ) ).toBe(
			'test-context_site-goals-tour'
		);
	} );

	it( 'should anchor all three steps to the key action, the breakdown notice, and the goal drivers when the notice is shown', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.steps ).toHaveLength( 3 );

		expect( tour.steps[ 0 ].target ).toBe(
			'.googlesitekit-site-goals-primary-action'
		);
		expect( tour.steps[ 1 ].target ).toBe(
			'.googlesitekit-site-goals-breakdown-notice'
		);
		expect( tour.steps[ 2 ].target ).toBe(
			'.googlesitekit-site-goals-goal-drivers-group'
		);
	} );

	it.each( [
		{
			notices: 'only the Online store widget shows the notice',
			params: ECOMMERCE_BREAKDOWN_NOTICE_ONLY,
		},
		{
			notices: 'only the Lead generation widget shows the notice',
			params: LEAD_BREAKDOWN_NOTICE_ONLY,
		},
	] )(
		'should include the breakdown notice step when $notices',
		( { params } ) => {
			const tour = getSiteGoalsTour( params );

			expect( tour.steps ).toHaveLength( 3 );
			expect( tour.steps[ 1 ].target ).toBe(
				'.googlesitekit-site-goals-breakdown-notice'
			);
		}
	);

	it( 'should omit the breakdown notice step when neither widget shows the notice', () => {
		const tour = getSiteGoalsTour( NO_BREAKDOWN_NOTICES );

		expect( tour.steps ).toHaveLength( 2 );

		expect( tour.steps.map( ( step ) => step.target ) ).not.toContain(
			'.googlesitekit-site-goals-breakdown-notice'
		);
		expect( tour.steps[ 0 ].target ).toBe(
			'.googlesitekit-site-goals-primary-action'
		);
		expect( tour.steps[ 1 ].target ).toBe(
			'.googlesitekit-site-goals-goal-drivers-group'
		);
	} );

	it.each( [
		{
			notices: 'both widgets show the notice',
			params: ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES,
			expectedCopy: STORE_COPY,
			otherCopy: FORMS_COPY,
		},
		{
			notices: 'only the Online store widget shows the notice',
			params: ECOMMERCE_BREAKDOWN_NOTICE_ONLY,
			expectedCopy: STORE_COPY,
			otherCopy: FORMS_COPY,
		},
		{
			notices: 'only the Lead generation widget shows the notice',
			params: LEAD_BREAKDOWN_NOTICE_ONLY,
			expectedCopy: FORMS_COPY,
			otherCopy: STORE_COPY,
		},
	] )(
		'should match the breakdown step copy to the widget it points at when $notices',
		( { params, expectedCopy, otherCopy } ) => {
			const tour = getSiteGoalsTour( params );

			expect( tour.steps[ 1 ].content ).toMatch( expectedCopy );
			expect( tour.steps[ 1 ].content ).not.toMatch( otherCopy );
		}
	);

	it( 'should title the breakdown step "Get into the details"', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.steps[ 1 ].title ).toBe( 'Get into the details' );
	} );

	it.each( [
		{
			notices: 'both widgets show the notice',
			params: ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES,
		},
		{
			notices: 'neither widget shows the notice',
			params: NO_BREAKDOWN_NOTICES,
		},
	] )(
		'should open on "Your main goal is front and center" and end on "Find what drives success" when $notices',
		( { params } ) => {
			const tour = getSiteGoalsTour( params );
			const lastStep = tour.steps[ tour.steps.length - 1 ];

			expect( tour.steps[ 0 ].title ).toBe(
				'Your main goal is front and center'
			);
			expect( tour.steps[ 0 ].content ).toMatch(
				/like sales or lead submissions/
			);
			expect( lastStep.title ).toBe( 'Find what drives success' );
			expect( lastStep.content ).toMatch(
				/which traffic channels or locations/
			);
		}
	);

	it( 'should set the "Done" label only on the last step', () => {
		const tour = getSiteGoalsTour( ECOMMERCE_AND_LEAD_BREAKDOWN_NOTICES );

		expect( tour.steps[ tour.steps.length - 1 ] ).toMatchObject( {
			locale: { last: 'Done' },
		} );

		// Only the last step sets a locale. The earlier steps keep the
		// shared "Got it" label.
		expect(
			tour.steps.slice( 0, -1 ).map( ( step ) => 'locale' in step )
		).toEqual( [ false, false ] );
	} );
} );

describe( 'waitForSiteGoalsSectionReady', () => {
	const PRELOAD_AREA_SLUG = 'mainDashboardKeyMetricsPrimary';

	afterEach( () => {
		document
			.querySelectorAll(
				'.googlesitekit-site-goals-primary-action, [class*="googlesitekit-widget-area--"]'
			)
			.forEach( ( element ) => element.remove() );
		jest.restoreAllMocks();
	} );

	it( 'finishes once the data has loaded and the target keeps the same position', async () => {
		jest.useFakeTimers();
		const target = appendTourTarget();
		// No placeholder on the page, and the target stays at the same top.
		jest.spyOn( target, 'getBoundingClientRect' ).mockReturnValue( {
			top: 100,
		} as DOMRect );

		const isSiteGoalsReady = waitForSiteGoalsSectionReady();

		let isResolved = false;
		isSiteGoalsReady.then( () => {
			isResolved = true;
		} );

		// The first check records the top, so the wait holds.
		await Promise.resolve();
		expect( isResolved ).toBe( false );

		// The second check sees the same top, so the wait resolves.
		jest.advanceTimersByTime( 250 );
		await expect( isSiteGoalsReady ).resolves.toBe( true );

		jest.useRealTimers();
	} );

	it( 'keeps waiting while an area still shows a placeholder, even when the target keeps the same position', async () => {
		jest.useFakeTimers();
		appendTourTarget();
		const area = appendPreloadArea( PRELOAD_AREA_SLUG );
		const placeholder = appendPlaceholder( area );

		const isSiteGoalsReady = waitForSiteGoalsSectionReady();

		let isResolved = false;
		isSiteGoalsReady.then( () => {
			isResolved = true;
		} );

		// A placeholder means the data has not loaded yet, so the wait
		// holds even though the target keeps the same position.
		for ( let check = 0; check < 4; check++ ) {
			jest.advanceTimersByTime( 250 );
			await Promise.resolve();
		}
		expect( isResolved ).toBe( false );

		// The data loads and the placeholder goes away, so the wait finishes.
		placeholder.remove();
		jest.advanceTimersByTime( 250 );

		await expect( isSiteGoalsReady ).resolves.toBe( true );

		jest.useRealTimers();
	} );

	it( 'keeps waiting while the target keeps shifting position', async () => {
		jest.useFakeTimers();
		const target = appendTourTarget();
		// No placeholder, but the top changes on every check, the way the
		// layout shifts while the content loads.
		let nextTop = 100;
		jest.spyOn( target, 'getBoundingClientRect' ).mockImplementation(
			() => ( { top: ( nextTop += 20 ) } as DOMRect )
		);

		const isSiteGoalsReady = waitForSiteGoalsSectionReady();

		let isResolved = false;
		isSiteGoalsReady.then( () => {
			isResolved = true;
		} );

		// Run several checks before the 30-second limit. The top never
		// repeats, so the wait must hold.
		for ( let check = 0; check < 10; check++ ) {
			jest.advanceTimersByTime( 250 );
			await Promise.resolve();
		}

		expect( isResolved ).toBe( false );

		jest.useRealTimers();
	} );

	it( 'keeps waiting while the target is missing, then finishes once it appears and stays still', async () => {
		jest.useFakeTimers();

		const isSiteGoalsReady = waitForSiteGoalsSectionReady();

		let isResolved = false;
		isSiteGoalsReady.then( () => {
			isResolved = true;
		} );

		// No target on the page yet, so the wait must hold.
		for ( let check = 0; check < 4; check++ ) {
			jest.advanceTimersByTime( 250 );
			await Promise.resolve();
		}
		expect( isResolved ).toBe( false );

		// The target appears and stays in place. One check records its top,
		// the next confirms it, so the wait resolves.
		appendTourTarget();
		jest.advanceTimersByTime( 250 );
		await Promise.resolve();
		jest.advanceTimersByTime( 250 );

		await expect( isSiteGoalsReady ).resolves.toBe( true );

		jest.useRealTimers();
	} );

	it( 'finishes after 30 seconds when the section never loads', async () => {
		jest.useFakeTimers();
		appendTourTarget();
		const area = appendPreloadArea( PRELOAD_AREA_SLUG );
		appendPlaceholder( area );

		const isSiteGoalsReady = waitForSiteGoalsSectionReady();

		// The placeholder never goes away, so only the 30-second limit ends
		// the wait. Run all 120 checks of 250ms each.
		for ( let check = 0; check < 120; check++ ) {
			jest.advanceTimersByTime( 250 );
			// Let the check finish before the next timer runs.
			await Promise.resolve();
		}

		await expect( isSiteGoalsReady ).resolves.toBe( true );

		jest.useRealTimers();
	} );
} );
