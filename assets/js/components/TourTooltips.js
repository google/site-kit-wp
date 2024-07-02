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
import { useMount } from 'react-use';
import Joyride, { ACTIONS, EVENTS, LIFECYCLE, STATUS } from 'react-joyride';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useRegistry } from 'googlesitekit-data';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { trackEvent } from '../util/tracking';
import TourTooltip from './TourTooltip';
import useViewContext from '../hooks/useViewContext';

/** For available options, see: {@link https://github.com/gilbarbara/react-joyride/blob/3e08384415a831b20ce21c8423b6c271ad419fbf/src/styles.js}. */
export const joyrideStyles = {
	options: {
		arrowColor: '#3c7251', // $c-content-primary
		backgroundColor: '#3c7251', // $c-content-primary
		overlayColor: 'rgba(0, 0, 0, 0.6)',
		textColor: '#fff', // $c-content-on-primary
		zIndex: 20000,
	},
	spotlight: {
		border: '2px solid #3c7251', // $c-content-primary
		backgroundColor: '#fff',
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
export const floaterProps = {
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

// GA Event Tracking actions (do not change!)
export const GA_ACTIONS = {
	VIEW: 'feature_tooltip_view',
	NEXT: 'feature_tooltip_advance',
	PREV: 'feature_tooltip_return',
	DISMISS: 'feature_tooltip_dismiss',
	COMPLETE: 'feature_tooltip_complete',
};

export default function TourTooltips( {
	steps,
	tourID,
	gaEventCategory,
	callback,
} ) {
	const stepKey = `${ tourID }-step`;
	const runKey = `${ tourID }-run`;
	const { setValue } = useDispatch( CORE_UI );
	const { dismissTour } = useDispatch( CORE_USER );
	const registry = useRegistry();

	const viewContext = useViewContext();

	const stepIndex = useSelect( ( select ) =>
		select( CORE_UI ).getValue( stepKey )
	);
	const run = useSelect( ( select ) => {
		return (
			select( CORE_UI ).getValue( runKey ) &&
			select( CORE_USER ).isTourDismissed( tourID ) === false
		);
	} );

	const changeStep = ( index, action ) =>
		setValue( stepKey, index + ( action === ACTIONS.PREV ? -1 : 1 ) );

	const startTour = () => {
		global.document.body.classList.add(
			'googlesitekit-showing-feature-tour',
			`googlesitekit-showing-feature-tour--${ tourID }`
		);
		setValue( runKey, true );
	};

	const endTour = () => {
		global.document.body.classList.remove(
			'googlesitekit-showing-feature-tour',
			`googlesitekit-showing-feature-tour--${ tourID }`
		);
		// Dismiss tour to avoid unwanted repeat viewing.
		dismissTour( tourID );
	};

	const trackAllTourEvents = ( {
		index,
		action,
		lifecycle,
		size,
		status,
		type,
	} ) => {
		// The index is 0-based, but step numbers are 1-based.
		const stepNumber = index + 1;

		const eventCategory =
			typeof gaEventCategory === 'function'
				? gaEventCategory( viewContext )
				: gaEventCategory;

		if ( type === EVENTS.TOOLTIP && lifecycle === LIFECYCLE.TOOLTIP ) {
			trackEvent( eventCategory, GA_ACTIONS.VIEW, stepNumber );
		} else if (
			action === ACTIONS.CLOSE &&
			lifecycle === LIFECYCLE.COMPLETE
		) {
			trackEvent( eventCategory, GA_ACTIONS.DISMISS, stepNumber );
		} else if (
			action === ACTIONS.NEXT &&
			status === STATUS.FINISHED &&
			type === EVENTS.TOUR_END &&
			// Here we need to additionally check the size === stepNumber because
			// it is the only way to differentiate the status/event combination
			// from an identical combination that happens immediately after completion
			// on index `0` to avoid duplicate measurement.
			size === stepNumber
		) {
			trackEvent( eventCategory, GA_ACTIONS.COMPLETE, stepNumber );
		}

		if ( lifecycle !== LIFECYCLE.COMPLETE || status === STATUS.FINISHED ) {
			return;
		}

		if ( action === ACTIONS.PREV ) {
			trackEvent( eventCategory, GA_ACTIONS.PREV, stepNumber );
		}
		if ( action === ACTIONS.NEXT ) {
			trackEvent( eventCategory, GA_ACTIONS.NEXT, stepNumber );
		}
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
	 * @since 1.28.0
	 * @since 1.38.0 Calls new callback prop.
	 * @see {@link https://docs.react-joyride.com/callback} Example data provided by `react-joyride`.
	 * @see {@link https://docs.react-joyride.com/constants} State & lifecycle constants used by `react-joyride`.
	 *
	 * @param {JoyrideCallbackData} data Data object provided via `react-joyride` callback prop.
	 */
	const handleJoyrideCallback = ( data ) => {
		trackAllTourEvents( data );
		const { action, index, status, step, type } = data;

		const hasCloseAction = action === ACTIONS.CLOSE;
		const shouldChangeStep =
			! hasCloseAction &&
			[ EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND ].includes( type );
		const isFinishedOrSkipped = [
			STATUS.FINISHED,
			STATUS.SKIPPED,
		].includes( status );
		const shouldCloseFromButtonClick =
			hasCloseAction && type === EVENTS.STEP_AFTER;
		const shouldEndTour = isFinishedOrSkipped || shouldCloseFromButtonClick;

		// Center the target in the viewport when transitioning to the step.
		if ( EVENTS.STEP_BEFORE === type ) {
			let el = step.target;
			if ( 'string' === typeof step.target ) {
				el = global.document.querySelector( step.target );
			}
			el?.scrollIntoView?.( { block: 'center' } );
		}

		if ( shouldChangeStep ) {
			changeStep( index, action );
		} else if ( shouldEndTour ) {
			endTour();
		}

		if ( callback ) {
			callback( data, registry );
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
			disableScrolling
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
	gaEventCategory: PropTypes.oneOfType( [ PropTypes.string, PropTypes.func ] )
		.isRequired,
	callback: PropTypes.func,
};
