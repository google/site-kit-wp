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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TourTooltip from './TourTooltip';
import Portal from './Portal';
import { joyrideStyles, floaterProps } from './TourTooltips';

export default function JoyrideTooltip( props ) {
	const {
		title,
		content,
		dismissLabel,
		target,
		cta = false,
		className,
		styles = {},
		slug = '',
		onDismiss = () => {},
		onView = () => {},
		onTourStart = () => {},
		onTourEnd = () => {},
	} = props;

	const checkIfTargetExists = () =>
		!! global.document.querySelector( target );

	const [ targetExists, setTargetExists ] = useState( checkIfTargetExists );
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
		if ( targetExists && global.ResizeObserver ) {
			const targetElement = global.document.querySelector( target );
			const resizeObserver = new ResizeObserver( () => {
				// Dispatch a window resize event to trigger the tooltip to reposition.
				global.dispatchEvent( new Event( 'resize' ) );
			} );
			resizeObserver.observe( targetElement );

			return () => {
				resizeObserver.disconnect();
			};
		}
	}, [ target, targetExists ] );

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
			placement: 'auto',
			cta,
			className,
		},
	];

	// Provides button content as well as aria-label & title attribute values.
	const joyrideLocale = {
		close: dismissLabel,
	};

	const callback = ( { type } ) => {
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
	};

	return (
		<Portal slug={ slug }>
			<Joyride
				callback={ callback }
				disableOverlay
				disableScrolling
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
				run
			/>
		</Portal>
	);
}

JoyrideTooltip.propTypes = {
	title: PropTypes.string.isRequired,
	content: PropTypes.string,
	dismissLabel: PropTypes.string,
	target: PropTypes.string.isRequired,
	onDismiss: PropTypes.func,
	onShow: PropTypes.func,
	className: PropTypes.string,
	styles: PropTypes.object,
	slug: PropTypes.string,
	onView: PropTypes.func,
};
