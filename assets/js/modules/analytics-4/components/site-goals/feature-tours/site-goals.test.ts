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

describe( 'getSiteGoalsTour', () => {
	const baseParams = { isEcommerceOnly: false, hasBreakdownNotice: true };

	it( 'should return the Site Goals tour with the right slug', () => {
		const tour = getSiteGoalsTour( baseParams );

		expect( tour.slug ).toBe( 'site-goals-feature-tour' );
	} );

	it( 'should be repeatable so the user can replay it from the Help menu', () => {
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
} );
