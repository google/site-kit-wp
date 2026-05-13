/**
 * WidgetDismissTransition component.
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
import classnames from 'classnames';
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Duration of the dismiss opacity transition, in milliseconds. The
 * state-machine timer uses this value as a floor before unmounting, so
 * it must match the CSS `transition-duration` applied to the
 * `googlesitekit-widget-dismiss-transition` selector in `_widgets.scss`
 * (otherwise the fade either gets cut off or sits at opacity 0 for the
 * remainder before unmount).
 */
export const DISMISS_TRANSITION_MS = 1000;

type Phase = 'visible' | 'dismissing' | 'hidden';

export interface WidgetDismissTransitionProps {
	/**
	 * `true` while the dismiss request is in flight (e.g.
	 * `select( CORE_USER ).isDismissingItem( slug )`). `undefined` while
	 * the underlying selector is still resolving.
	 */
	isDismissing: boolean | undefined;
	/**
	 * `true` once the dismissal has persisted (e.g.
	 * `select( CORE_USER ).isItemDismissed( slug )`). `undefined` while
	 * the underlying selector is still resolving.
	 */
	isDismissed: boolean | undefined;
	/**
	 * Invoked exactly once per successful dismiss attempt, after the fade
	 * transition has elapsed and the dismissal has persisted.
	 */
	onDismissComplete?: () => void;
	/**
	 * Optional className applied to the wrapper element in addition to
	 * the modifier class managed by the wrapper.
	 */
	className?: string;
	children: ReactNode;
}

const WidgetDismissTransition: FC< WidgetDismissTransitionProps > = ( {
	isDismissing,
	isDismissed,
	onDismissComplete,
	className,
	children,
} ) => {
	const [ phase, setPhase ] = useState< Phase >( 'visible' );
	const [ timerExpiredFor, setTimerExpiredFor ] = useState< number >( -1 );

	const attemptIDRef = useRef< number >( 0 );
	const completedAttemptRef = useRef< number >( -1 );
	const timeoutRef = useRef< ReturnType< typeof setTimeout > >();

	const isLoading = isDismissing === undefined || isDismissed === undefined;

	// Start a new dismiss attempt whenever isDismissing transitions to true.
	// We don't clear the timer on cleanup of this effect (only on unmount or
	// when superseded by a new attempt) so the fade still plays out even if
	// the request resolves quickly.
	useEffect( () => {
		if ( isLoading ) {
			return;
		}
		if ( ! isDismissing ) {
			return;
		}
		if ( phase === 'dismissing' ) {
			// Already animating; ignore re-renders triggered by other prop
			// changes during the dismiss.
			return;
		}

		const myAttempt = attemptIDRef.current + 1;
		attemptIDRef.current = myAttempt;
		setPhase( 'dismissing' );

		if ( timeoutRef.current ) {
			clearTimeout( timeoutRef.current );
		}
		timeoutRef.current = setTimeout( () => {
			if ( attemptIDRef.current === myAttempt ) {
				setTimerExpiredFor( myAttempt );
			}
		}, DISMISS_TRANSITION_MS );
	}, [ isDismissing, isLoading, phase ] );

	// Resolve the attempt once BOTH the timer has fired AND the request
	// has settled. Slow-network: timer fires first, we wait here. Fast-
	// network: request settles first, we wait for the timer.
	useEffect( () => {
		if ( phase !== 'dismissing' ) {
			return;
		}
		if ( isLoading ) {
			return;
		}
		if ( timerExpiredFor !== attemptIDRef.current ) {
			return;
		}
		if ( isDismissing ) {
			return;
		}
		if ( completedAttemptRef.current === attemptIDRef.current ) {
			return;
		}
		completedAttemptRef.current = attemptIDRef.current;

		if ( isDismissed === true ) {
			onDismissComplete?.();
			setPhase( 'hidden' );
		} else {
			setPhase( 'visible' );
		}
	}, [
		phase,
		timerExpiredFor,
		isDismissing,
		isDismissed,
		isLoading,
		onDismissComplete,
	] );

	// Clear any pending timer on unmount.
	useEffect( () => {
		return () => {
			if ( timeoutRef.current ) {
				clearTimeout( timeoutRef.current );
			}
		};
	}, [] );

	if ( phase === 'hidden' ) {
		return null;
	}

	const isDismissingPhase = phase === 'dismissing';

	return (
		<div
			className={ classnames(
				'googlesitekit-widget-dismiss-transition',
				{
					'googlesitekit-widget-dismiss-transition--dismissing':
						isDismissingPhase,
				},
				className
			) }
		>
			{ children }
		</div>
	);
};

export default WidgetDismissTransition;
