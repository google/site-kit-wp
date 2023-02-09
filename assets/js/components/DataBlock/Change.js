/**
 * Change component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { numFmt } from '../../util';
import ChangeArrow from '../ChangeArrow';

const Change = ( { change, changeDataUnit, period, invertChangeColor } ) => {
	let changeFormatted = change;

	// If changeDataUnit is given, try using it as currency first, otherwise add it as suffix.
	if ( changeDataUnit ) {
		if ( changeDataUnit === '%' ) {
			// Format percentage change with only 1 digit instead of the usual 2.
			changeFormatted = numFmt( change, {
				style: 'percent',
				signDisplay: 'never',
				maximumFractionDigits: 1,
			} );
		} else {
			changeFormatted = numFmt( change, changeDataUnit );
		}
	}

	// If period is given (requires %s placeholder), add it.
	if ( period ) {
		changeFormatted = sprintf( period, changeFormatted );
	}

	return (
		<div
			className={ classnames( 'googlesitekit-data-block__change', {
				'googlesitekit-data-block__change--no-change': ! change,
			} ) }
		>
			{ !! change && (
				<span className="googlesitekit-data-block__arrow">
					<ChangeArrow
						direction={ 0 < parseFloat( change ) ? 'up' : 'down' }
						invertColor={ invertChangeColor }
					/>
				</span>
			) }
			<span className="googlesitekit-data-block__value">
				{ changeFormatted }
			</span>
		</div>
	);
};

Change.propTypes = {
	change: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	changeDataUnit: PropTypes.oneOfType( [ PropTypes.string, PropTypes.bool ] ),
	period: PropTypes.string,
	invertChangeColor: PropTypes.bool,
};

export default Change;
