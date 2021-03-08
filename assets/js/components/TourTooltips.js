/**
 * TourTooltips component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useLocalStorage, useMount } from 'react-use';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import TourTooltip from './TourTooltip';
const { useSelect, useDispatch } = Data;

/** For available options, see: {@link https://github.com/gilbarbara/react-joyride/blob/3e08384415a831b20ce21c8423b6c271ad419fbf/src/styles.js}. */
const joyrideStyles = {
	options: {
		arrowColor: '#1A73E8', // $c-royal-blue
		backgroundColor: '#1A73E8', // $c-royal-blue
		overlayColor: 'rgba(0, 0, 0, 0.6)',
		textColor: '#ffffff', // $c-white
	},
};

// Provides button content as well as aria-label & title attribute values.
const joyrideLocale = {
	back: __( 'Back', 'google-site-kit' ),
	close: __( 'Close', 'google-site-kit' ),
	last: __( 'Got it', 'google-site-kit' ),
	next: __( 'Next', 'google-site-kit' ),
};

/** For available options, see: {@link https://github.com/gilbarbara/react-floater#props}. */
const floaterProps = {
	disableAnimation: true,
	styles: {
		arrow: {
			length: 8,
			margin: 56,
			spread: 16,
		},
		floater: {
			filter: 'drop-shadow(rgba(60, 64, 67, 0.3) 0px 1px 2px) drop-shadow(rgba(60, 64, 67, 0.15) 0px 2px 6px)',
		},
	},
};

export default function TourTooltips( { steps, tourID } ) {
	const stepKey = `${ tourID }-step`;
	const runKey = `${ tourID }-run`;
	const { setValue } = useDispatch( CORE_UI );
	const [ shouldSkipTour, setShouldSkipTour ] = useLocalStorage( `sitekit-${ tourID }__has-encountered-tour` );

	const stepIndex = useSelect( ( select ) => select( CORE_UI ).getValue( stepKey ) );
	const run = useSelect( ( select ) => select( CORE_UI ).getValue( runKey ) || false );

	const changeStep = ( index, action ) => setValue(
		stepKey,
		index + ( action === ACTIONS.PREV ? -1 : 1 ),
	);

	const startTour = () => {
		// Checks if user has completed or skipped tour already, do not re-run tour if so.
		if ( ! shouldSkipTour ) {
			setValue( runKey, true );
		}
	};

	const endTour = () => {
		// Add to localStorage to avoid unwanted repeat viewing.
		setShouldSkipTour( true );
		setValue( runKey, false );
	};

	/**
	 * Handles `react-joyride` state changes using callback function.
	 *
	 * @typedef {Object} JoyrideCallbackData
	 * @property {string} action The action that updated the state.
	 * @property {status} status The tour's status.
	 * @property {number} index  Step index.
	 * @property {string} type   Specific type (tour, step, beacon).
	 *
	 * @since n.e.x.t
	 * @see {@link https://docs.react-joyride.com/callback} Example data provided by `react-joyride`.
	 * @see {@link https://docs.react-joyride.com/constants} State & lifecycle constants used by `react-joyride`.
	 *
	 * @param {JoyrideCallbackData} data Data object provided via `react-joyride` callback prop.
	 */
	const handleJoyrideCallback = ( data ) => {
		const { action, index, status, type } = data;

		const hasCloseAction = action === ACTIONS.CLOSE;
		const shouldChangeStep = ! hasCloseAction && [ EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND ].includes( type );
		const isFinishedOrSkipped = [ STATUS.FINISHED, STATUS.SKIPPED ].includes( status );
		const shouldCloseFromButtonClick = hasCloseAction && type === EVENTS.STEP_AFTER;
		const shouldEndTour = isFinishedOrSkipped || shouldCloseFromButtonClick;

		if ( shouldChangeStep ) {
			changeStep( index, action );
		} else if ( shouldEndTour ) {
			endTour();
		}
	};

	// Start tour on initial render
	useMount( startTour );

	const parsedSteps = steps.map( ( step ) => ( {
		disableBeacon: true,
		isFixed: true,
		placement: 'auto',
		...step,
	} ) );

	return (
		<Joyride
			callback={ handleJoyrideCallback }
			continuous
			disableOverlayClose
			floaterProps={ floaterProps }
			locale={ joyrideLocale }
			run={ run }
			showProgress
			stepIndex={ stepIndex }
			steps={ parsedSteps }
			styles={ joyrideStyles }
			tooltipComponent={ TourTooltip }
		/>
	);
}

/** For available properties & docs for `steps`, see: {@link https://docs.react-joyride.com/step#options}. */
TourTooltips.propTypes = {
	steps: PropTypes.arrayOf( PropTypes.object ).isRequired,
	tourID: PropTypes.string.isRequired,
};
