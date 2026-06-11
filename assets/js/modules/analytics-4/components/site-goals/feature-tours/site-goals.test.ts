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
import { getSiteGoalsTour } from './site-goals';

// Adds the tour's first step target to the page, so `checkRequirements`
// resolves right away. The `afterEach` below removes it.
function appendTourTarget() {
	const target = document.createElement( 'div' );
	target.className = 'googlesitekit-site-goals-primary-action';
	document.body.appendChild( target );
}

describe( 'getSiteGoalsTour', () => {
	const baseParams = { isEcommerceOnly: false, hasBreakdownNotice: true };

	afterEach( () => {
		document
			.querySelectorAll( '.googlesitekit-site-goals-primary-action' )
			.forEach( ( target ) => target.remove() );
	} );

	it( 'should return the Site Goals tour with the right slug', () => {
		const tour = getSiteGoalsTour( baseParams );

		expect( tour.slug ).toBe( 'site-goals-feature-tour' );
	} );

	it( 'should be repeatable so the tour can start again on demand', () => {
		const tour = getSiteGoalsTour( baseParams );

		expect( tour.isRepeatable ).toBe( true );
	} );

	it( 'should be scoped to the main dashboard', () => {
		const tour = getSiteGoalsTour( baseParams );

		expect( tour.contexts ).toEqual( [ 'mainDashboard' ] );
	} );

	it( 'should preload the Site Goals widget area so the targets are in view before the first callout opens', () => {
		const tour = getSiteGoalsTour( baseParams );

		expect( tour.preloadWidgetAreas ).toEqual( [
			'mainDashboardSiteGoalsPrimary',
		] );
	} );

	it( 'should prefix the Google Analytics event category with the current view context', () => {
		const tour = getSiteGoalsTour( baseParams );

		expect( tour.gaEventCategory( 'test-context' ) ).toBe(
			'test-context_site-goals-tour'
		);
	} );

	it( 'should anchor all three steps to the key action, the breakdown notice, and the goal drivers when the notice is shown', () => {
		const tour = getSiteGoalsTour( {
			...baseParams,
			hasBreakdownNotice: true,
		} );

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

	it( 'should omit the breakdown notice step when the notice is not shown', () => {
		const tour = getSiteGoalsTour( {
			...baseParams,
			hasBreakdownNotice: false,
		} );

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

	it( 'should use the leads copy in the breakdown step when isEcommerceOnly is false', () => {
		const tour = getSiteGoalsTour( {
			isEcommerceOnly: false,
			hasBreakdownNotice: true,
		} );

		expect( tour.steps[ 1 ].content ).toMatch( /each individual form/ );
	} );

	it( 'should use the sales copy in the breakdown step when isEcommerceOnly is true', () => {
		const tour = getSiteGoalsTour( {
			isEcommerceOnly: true,
			hasBreakdownNotice: true,
		} );

		expect( tour.steps[ 1 ].content ).toMatch(
			/WooCommerce or Easy Digital Downloads/
		);
	} );

	it( 'should resolve checkRequirements right away when the first step target is on the page', async () => {
		appendTourTarget();

		const tour = getSiteGoalsTour( baseParams );

		await expect( tour.checkRequirements() ).resolves.toBe( true );
	} );

	it( 'should keep checkRequirements waiting until the first step target renders', async () => {
		const tour = getSiteGoalsTour( baseParams );

		const requirementsPromise = tour.checkRequirements();

		let isResolved = false;
		requirementsPromise.then( () => {
			isResolved = true;
		} );

		// Give checkRequirements time to look for the target. It must keep
		// waiting while the target is missing.
		await new Promise( ( resolve ) => {
			setTimeout( resolve, 300 );
		} );
		expect( isResolved ).toBe( false );

		appendTourTarget();

		await expect( requirementsPromise ).resolves.toBe( true );
	} );

	it( 'should resolve checkRequirements after five seconds when the target never renders', async () => {
		jest.useFakeTimers();

		const tour = getSiteGoalsTour( baseParams );
		const requirementsPromise = tour.checkRequirements();

		// Run all 20 timers of 250ms each. This is the full five-second
		// wait.
		for ( let check = 0; check < 20; check++ ) {
			jest.advanceTimersByTime( 250 );
			// Let the check finish before the next timer runs.
			await Promise.resolve();
		}

		await expect( requirementsPromise ).resolves.toBe( true );

		jest.useRealTimers();
	} );

	it( 'should set the "Done" label only on the last step', () => {
		const tour = getSiteGoalsTour( {
			...baseParams,
			hasBreakdownNotice: true,
		} );

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
