/**
 * Notification queue timing instrumentation.
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
import { getQueryArg } from '@wordpress/url';

export const QUEUE_TIMING_DEBUG_KEY = 'googlesitekit_debug_queue';

const MARK_PREFIX = 'googlesitekit';

export interface CheckTiming {
	id: string;
	calls: number;
	totalMilliseconds: number;
	slowestMilliseconds: number;
	lastResult: boolean | undefined;
}

export interface QueueTimingSummary {
	viewContext: string;
	groupID: string;
	run: number;
	headID: string | null;
	millisecondsFromNavigationToHead: number | null;
	millisecondsToHead: number | null;
	totalMilliseconds: number;
	millisecondsFromNavigationToResolved: number;
	queueLength: number;
	checkCount: number;
	checkCalls: number;
	checks: CheckTiming[];
}

export interface QueueTiming {
	timeCheck: (
		id: string,
		check: () => Promise< boolean >
	) => Promise< boolean >;
	markHead: ( id: string ) => void;
	finish: ( queueLength: number ) => QueueTimingSummary;
}

let runCount = 0;

function getPerformance(): Performance | undefined {
	const { performance } = global;

	if (
		typeof performance?.now !== 'function' ||
		typeof performance?.mark !== 'function' ||
		typeof performance?.measure !== 'function'
	) {
		return undefined;
	}

	return performance;
}

function now(): number {
	return getPerformance()?.now() ?? 0;
}

function mark( name: string ) {
	try {
		getPerformance()?.mark( name );
	} catch {
		// Timing must never break the queue.
	}
}

function measure( name: string, startMark?: string ) {
	try {
		const performance = getPerformance();

		if ( ! performance ) {
			return;
		}

		if ( startMark ) {
			performance.measure( name, startMark );
		} else {
			// Without a start mark, the measure starts at navigation.
			performance.measure( name );
		}
	} catch {
		// Timing must never break the queue.
	}
}

/**
 * Determines whether the queue timings should be logged to the console.
 *
 * Logging is turned on by the `googlesitekit_debug_queue` query arg or
 * `localStorage` key, set to any value other than `0`.
 *
 * @since n.e.x.t
 *
 * @return {boolean} True when the timings should be logged.
 */
export function isQueueTimingDebugEnabled(): boolean {
	const queryValue = getQueryArg(
		global.location?.href || '',
		QUEUE_TIMING_DEBUG_KEY
	);

	if ( queryValue !== undefined ) {
		return queryValue !== '0';
	}

	try {
		const storedValue = global.localStorage?.getItem(
			QUEUE_TIMING_DEBUG_KEY
		);

		return !! storedValue && storedValue !== '0';
	} catch {
		return false;
	}
}

function logSummary( summary: QueueTimingSummary ) {
	const { console } = global;

	console.groupCollapsed(
		`[Site Kit] Notification queue "${ summary.groupID }" (${
			summary.viewContext
		}): head "${
			summary.headID
		}" after ${ summary.millisecondsToHead?.toFixed(
			1
		) } ms, resolved in ${ summary.totalMilliseconds.toFixed( 1 ) } ms`
	);
	console.table( {
		headID: summary.headID,
		millisecondsFromNavigationToHead:
			summary.millisecondsFromNavigationToHead,
		millisecondsToHead: summary.millisecondsToHead,
		totalMilliseconds: summary.totalMilliseconds,
		millisecondsFromNavigationToResolved:
			summary.millisecondsFromNavigationToResolved,
		queueLength: summary.queueLength,
		checkCount: summary.checkCount,
		checkCalls: summary.checkCalls,
	} );
	console.table( summary.checks );
	console.groupEnd();
}

/**
 * Starts timing one population of a notification queue.
 *
 * Records `performance` marks and measures named
 * `googlesitekit:queue:<viewContext>:<groupID>:<run>`, so that they show in
 * the Timings track of the browser's Performance panel. Every summary is also
 * pushed to `global._googlesitekitNotificationQueueTimings`, and logged to the
 * console when `isQueueTimingDebugEnabled()` is true.
 *
 * @since n.e.x.t
 *
 * @param {string} viewContext View context the queue is populated for.
 * @param {string} groupID     Group ID of the queue.
 * @return {Object} Functions to time each check, mark the head and finish.
 */
export function startQueueTiming(
	viewContext: string,
	groupID: string
): QueueTiming {
	runCount += 1;

	const run = runCount;
	const queueName = `${ MARK_PREFIX }:queue:${ viewContext }:${ groupID }:${ run }`;
	const startedAt = now();
	const checks: Record< string, CheckTiming > = {};
	let headID: string | null = null;
	let headAt: number | null = null;

	mark( `${ queueName }:start` );

	function recordCheck(
		id: string,
		checkName: string,
		checkStartedAt: number,
		result: boolean | undefined
	) {
		measure( checkName, `${ checkName }:start` );

		const duration = now() - checkStartedAt;
		const timing = checks[ id ] || {
			id,
			calls: 0,
			totalMilliseconds: 0,
			slowestMilliseconds: 0,
			lastResult: undefined,
		};

		timing.calls += 1;
		timing.totalMilliseconds += duration;
		timing.slowestMilliseconds = Math.max(
			timing.slowestMilliseconds,
			duration
		);
		timing.lastResult = result;
		checks[ id ] = timing;
	}

	async function timeCheck(
		id: string,
		check: () => Promise< boolean >
	): Promise< boolean > {
		const checkName = `${ MARK_PREFIX }:check:${ id }:${ run }`;

		mark( `${ checkName }:start` );

		const checkStartedAt = now();

		try {
			const result = await check();
			recordCheck( id, checkName, checkStartedAt, result );
			return result;
		} catch ( error ) {
			recordCheck( id, checkName, checkStartedAt, undefined );
			throw error;
		}
	}

	function markHead( id: string ) {
		if ( headID !== null ) {
			return;
		}

		headID = id;
		headAt = now();
		measure( `${ MARK_PREFIX }:queue-head:${ viewContext }:${ groupID }` );
	}

	function finish( queueLength: number ): QueueTimingSummary {
		measure( queueName, `${ queueName }:start` );

		const finishedAt = now();
		const checkTimings = Object.values( checks ).sort(
			( a, b ) => b.totalMilliseconds - a.totalMilliseconds
		);

		const summary: QueueTimingSummary = {
			viewContext,
			groupID,
			run,
			headID,
			millisecondsFromNavigationToHead: headAt,
			millisecondsToHead: headAt === null ? null : headAt - startedAt,
			totalMilliseconds: finishedAt - startedAt,
			millisecondsFromNavigationToResolved: finishedAt,
			queueLength,
			checkCount: checkTimings.length,
			checkCalls: checkTimings.reduce(
				( total, timing ) => total + timing.calls,
				0
			),
			checks: checkTimings,
		};

		global._googlesitekitNotificationQueueTimings = [
			...( global._googlesitekitNotificationQueueTimings || [] ),
			summary,
		];

		if ( isQueueTimingDebugEnabled() ) {
			logSummary( summary );
		}

		return summary;
	}

	return { timeCheck, markHead, finish };
}
