/**
 * Tooltip component.
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

/**
 * Internal dependencies
 */
import TourTooltip from './TourTooltip';

// TODO: Share this configuration with TourTooltips, where it's been copied from.

/** For available options, see: {@link https://github.com/gilbarbara/react-joyride/blob/3e08384415a831b20ce21c8423b6c271ad419fbf/src/styles.js}. */
const joyrideStyles = {
	options: {
		arrowColor: '#1A73E8', // $c-royal-blue
		backgroundColor: '#1A73E8', // $c-royal-blue
		overlayColor: 'rgba(0, 0, 0, 0.6)',
		textColor: '#ffffff', // $c-white
	},
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
			filter:
				'drop-shadow(rgba(60, 64, 67, 0.3) 0px 1px 2px) drop-shadow(rgba(60, 64, 67, 0.15) 0px 2px 6px)',
		},
	},
};

export default function Tooltip( {
	title,
	content,
	dismissLabel,
	target,
	onDismiss = () => {},
} ) {
	const steps = [
		{
			title,
			target,
			content,
			disableBeacon: true,
			isFixed: true,
			placement: 'auto',
		},
	];

	// Provides button content as well as aria-label & title attribute values.
	const joyrideLocale = {
		last: dismissLabel,
	};

	return (
		<Joyride
			callback={ ( { type } ) => {
				if ( type === EVENTS.STEP_AFTER ) {
					// This is not strictly necessary as the tooltip will hide without it, but this allows the consumer of the component to clean up post-dismiss.
					onDismiss();
				}
			} }
			disableOverlay
			disableScrolling
			floaterProps={ floaterProps }
			locale={ joyrideLocale }
			run={ true }
			steps={ steps }
			styles={ joyrideStyles }
			tooltipComponent={ TourTooltip }
		/>
	);
}

Tooltip.propTypes = {
	title: PropTypes.string.isRequired,
	content: PropTypes.string.isRequired,
	dismissLabel: PropTypes.string.isRequired,
	target: PropTypes.string.isRequired,
	onDismiss: PropTypes.func,
};
