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
import classnames from 'classnames';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { calculateChange, numFmt } from '@/js/util';

export interface ChangeBadgeProps {
	previousValue: number;
	currentValue: number;
	isAbsolute?: boolean;
	zeroChangeLabel?: string;
}

const ChangeBadge: FC< ChangeBadgeProps > = ( {
	previousValue,
	currentValue,
	isAbsolute = false,
	zeroChangeLabel,
} ) => {
	const change = isAbsolute
		? currentValue - previousValue
		: calculateChange( previousValue, currentValue );

	// Do not display the change badge if the change value can't be calculated.
	if ( change === null ) {
		return null;
	}

	const isNegative = change < 0;
	const isZero = change === 0;

	const formattedChange = numFmt( change, {
		style: 'percent',
		signDisplay: 'exceptZero',
		maximumFractionDigits: 1,
	} );

	return (
		<div
			className={ classnames( 'googlesitekit-change-badge', {
				'googlesitekit-change-badge--negative': isNegative,
				'googlesitekit-change-badge--zero': isZero,
			} ) }
		>
			{ isZero && zeroChangeLabel ? zeroChangeLabel : formattedChange }
		</div>
	);
};

export default ChangeBadge;
