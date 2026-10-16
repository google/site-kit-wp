/**
 * Notification queue timing instrumentation tests.
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
	QUEUE_TIMING_DEBUG_KEY,
	isQueueTimingDebugEnabled,
	startQueueTiming,
} from './queue-timing';

describe( 'queue timing', () => {
	let groupCollapsedSpy: jest.SpyInstance;
	let tableSpy: jest.SpyInstance;
	let groupEndSpy: jest.SpyInstance;

	beforeEach( () => {
		global._googlesitekitNotificationQueueTimings = undefined;
		global.localStorage.removeItem( QUEUE_TIMING_DEBUG_KEY );
		global.history.replaceState( {}, '', '/' );

		groupCollapsedSpy = jest
			.spyOn( global.console, 'groupCollapsed' )
			.mockImplementation( () => {} );
		tableSpy = jest
			.spyOn( global.console, 'table' )
			.mockImplementation( () => {} );
		groupEndSpy = jest
			.spyOn( global.console, 'groupEnd' )
			.mockImplementation( () => {} );
	} );

	afterEach( () => {
		groupCollapsedSpy.mockRestore();
		tableSpy.mockRestore();
		groupEndSpy.mockRestore();
	} );

	it( 'counts every call of each check and keeps its last result', async () => {
		const timing = startQueueTiming( 'mainDashboard', 'default' );

		await timing.timeCheck( 'first', () => Promise.resolve( false ) );
		await timing.timeCheck( 'first', () => Promise.resolve( true ) );
		await timing.timeCheck( 'second', () => Promise.resolve( false ) );

		const summary = timing.finish( 1 );

		expect( summary.checkCount ).toBe( 2 );
		expect( summary.checkCalls ).toBe( 3 );
		expect(
			summary.checks.find( ( { id } ) => id === 'first' )
		).toMatchObject( { calls: 2, lastResult: true } );
	} );

	it( 'records a check that throws and passes the error on', async () => {
		const timing = startQueueTiming( 'mainDashboard', 'default' );

		await expect(
			timing.timeCheck( 'broken', () =>
				Promise.reject( new Error( 'broken' ) )
			)
		).rejects.toThrow( 'broken' );

		expect( timing.finish( 0 ).checks[ 0 ] ).toMatchObject( {
			id: 'broken',
			calls: 1,
			lastResult: undefined,
		} );
	} );

	it( 'keeps the first notification marked as the head', () => {
		const timing = startQueueTiming( 'mainDashboard', 'default' );

		timing.markHead( 'head' );
		timing.markHead( 'second' );

		const summary = timing.finish( 2 );

		expect( summary.headID ).toBe( 'head' );
		expect( summary.millisecondsToHead ).not.toBeNull();
	} );

	it( 'reports no head when nothing was queued', () => {
		const summary = startQueueTiming( 'mainDashboard', 'default' ).finish(
			0
		);

		expect( summary.headID ).toBeNull();
		expect( summary.millisecondsToHead ).toBeNull();
	} );

	it( 'adds every summary to the global list', () => {
		startQueueTiming( 'mainDashboard', 'default' ).finish( 0 );
		startQueueTiming( 'mainDashboard', 'setup-ctas' ).finish( 0 );

		expect(
			global._googlesitekitNotificationQueueTimings?.map(
				( { groupID } ) => groupID
			)
		).toEqual( [ 'default', 'setup-ctas' ] );
	} );

	it( 'does not log when debugging is off', () => {
		startQueueTiming( 'mainDashboard', 'default' ).finish( 0 );

		expect( groupCollapsedSpy ).not.toHaveBeenCalled();
	} );

	it( 'logs the summary when the query arg is set', () => {
		global.history.replaceState(
			{},
			'',
			`/?${ QUEUE_TIMING_DEBUG_KEY }=1`
		);

		startQueueTiming( 'mainDashboard', 'default' ).finish( 0 );

		expect( groupCollapsedSpy ).toHaveBeenCalledTimes( 1 );
		expect( tableSpy ).toHaveBeenCalledTimes( 2 );
		expect( groupEndSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'reads the debug flag from the query arg before local storage', () => {
		global.localStorage.setItem( QUEUE_TIMING_DEBUG_KEY, '1' );

		expect( isQueueTimingDebugEnabled() ).toBe( true );

		global.history.replaceState(
			{},
			'',
			`/?${ QUEUE_TIMING_DEBUG_KEY }=0`
		);

		expect( isQueueTimingDebugEnabled() ).toBe( false );
	} );

	it( 'still times checks when the Performance API is missing', async () => {
		const { performance } = global;

		// @ts-expect-error Removing the Performance API for this test.
		delete global.performance;

		try {
			const timing = startQueueTiming( 'mainDashboard', 'default' );

			await expect(
				timing.timeCheck( 'check', () => Promise.resolve( true ) )
			).resolves.toBe( true );
			expect( timing.finish( 1 ).checkCalls ).toBe( 1 );
		} finally {
			global.performance = performance;
		}
	} );
} );
