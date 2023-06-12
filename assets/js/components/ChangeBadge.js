/**
 * ChangeBadge component.
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
 * Internal dependencies
 */
import { calculateChange, numFmt } from '../util';

export default function ChangeBadge( props ) {
	const { previousValue, currentValue, isAbsolute } = props;

	const change = isAbsolute
		? currentValue - previousValue
		: calculateChange( previousValue, currentValue );
	const isNegative = change < 0;
	const isZero = change === 0;

	// Do not display the change badge if the change value can't be calculated.
	if ( change === null ) {
		return null;
	}

	return (
		<div
			className={ classnames( 'googlesitekit-change-badge', {
				'googlesitekit-change-badge--negative': isNegative,
				'googlesitekit-change-badge--zero': isZero,
			} ) }
		>
			{ numFmt( change, {
				style: 'percent',
				signDisplay: 'exceptZero',
				maximumFractionDigits: 1,
			} ) }
		</div>
	);
}

ChangeBadge.propTypes = {
	isAbsolute: PropTypes.bool,
	previousValue: PropTypes.number.isRequired,
	currentValue: PropTypes.number.isRequired,
};
