/**
 * JoyRideTooltip component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { PropTypes } from 'prop-types';
import Joyride, { EVENTS } from 'react-joyride';
import { useInterval } from 'react-use';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TourTooltip from './TourTooltip';
import Portal from './Portal';
import { joyrideStyles, floaterProps } from './TourTooltips';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';

export default function JoyrideTooltip( props ) {
	const {
		title,
		content,
		dismissLabel,
		disableOverlay = true,
		target,
		cta = false,
		className,
		styles = {},
		slug = '',
		placement = 'auto',
		onDismiss = () => {},
		onView = () => {},
		onTourStart = () => {},
		onTourEnd = () => {},
	} = props;

	function checkIfTargetExists() {
		return !! global.document.querySelector( target );
	}

	const [ targetExists, setTargetExists ] = useState( checkIfTargetExists );

	const breakpoint = useBreakpoint();
	const isMobileTablet =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;
	const [ shouldRun, setShouldRun ] = useState( true );
	const previousIsMobileTabletRef = useRef( isMobileTablet );

	useInterval(
		() => {
			if ( checkIfTargetExists() ) {
				setTargetExists( true );
			}
		},
		// An delay of null will stop the interval.
		targetExists ? null : 250
	);

	useEffect( () => {
		// eslint-disable-next-line sitekit/function-declaration-consistency
		let disconnect = () => {};

		if ( typeof global.ResizeObserver === 'function' ) {
			const targetElement = global.document.querySelector( target );

			if ( targetElement ) {
				const resizeObserver = new ResizeObserver( () => {
					// Dispatch a window resize event to trigger the tooltip to reposition.
					global.dispatchEvent( new Event( 'resize' ) );
				} );

				resizeObserver.observe( targetElement );
				disconnect = () => resizeObserver.disconnect();
			}
		}

		return disconnect;
	}, [ target, targetExists ] );

	// Reset the component between mobile and desktop layouts they use different
	// targets which requires the tooltip to be re-rendered to display correctly.
	useEffect( () => {
		let timeoutID;

		if ( previousIsMobileTabletRef.current !== isMobileTablet ) {
			setShouldRun( false );

			timeoutID = setTimeout( () => {
				setShouldRun( true );
			}, 50 );

			previousIsMobileTabletRef.current = isMobileTablet;
		}

		return () => {
			if ( timeoutID ) {
				clearTimeout( timeoutID );
			}
		};
	}, [ isMobileTablet ] );

	// Joyride expects the step's target to be in the DOM immediately
	// so we need to wait for it in some cases, e.g. loading data.
	if ( ! targetExists ) {
		return null;
	}

	const steps = [
		{
			title,
			target,
			content,
			disableBeacon: true,
			isFixed: true,
			placement,
			cta,
			className,
		},
	];

	// Provides button content as well as aria-label & title attribute values.
	const joyrideLocale = {
		close: dismissLabel,
		last: dismissLabel,
	};

	function callback( { type } ) {
		switch ( type ) {
			case EVENTS.TOUR_START:
				onTourStart();
				global.document.body.classList.add(
					'googlesitekit-showing-tooltip'
				);
				break;
			case EVENTS.TOUR_END:
				onTourEnd();
				global.document.body.classList.remove(
					'googlesitekit-showing-tooltip'
				);
				break;
			case EVENTS.STEP_AFTER:
				// This is not strictly necessary as the tooltip will hide without it,
				// but this allows the consumer of the component to clean up
				// post-dismiss.
				onDismiss();
				break;
			case EVENTS.TOOLTIP:
				onView();
				break;
		}
	}

	return (
		<Portal slug={ slug }>
			<Joyride
				callback={ callback }
				disableOverlay={ disableOverlay }
				spotlightPadding={ 0 }
				floaterProps={ floaterProps }
				locale={ joyrideLocale }
				steps={ steps }
				styles={ {
					...joyrideStyles,
					...styles,
					options: {
						...joyrideStyles.options,
						...styles?.options,
					},
					spotlight: {
						...joyrideStyles.spotlight,
						...styles?.spotlight,
					},
				} }
				tooltipComponent={ TourTooltip }
				run={ shouldRun }
				disableScrolling
			/>
		</Portal>
	);
}

JoyrideTooltip.propTypes = {
	title: PropTypes.node,
	content: PropTypes.string,
	disableOverlay: PropTypes.bool,
	dismissLabel: PropTypes.string,
	target: PropTypes.string.isRequired,
	onDismiss: PropTypes.func,
	onShow: PropTypes.func,
	className: PropTypes.string,
	styles: PropTypes.object,
	slug: PropTypes.string,
	placement: PropTypes.string,
	onView: PropTypes.func,
};
