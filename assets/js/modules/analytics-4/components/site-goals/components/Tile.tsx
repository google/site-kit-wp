/**
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import ChangeBadge from '@/js/components/ChangeBadge';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { numFmt } from '@/js/util';
import GoalTile from './GoalTile';

export interface TileProps {
	className?: string;
	title: string;
	subtitle: string;
	infoTooltip?: ReactNode;
	currentValue: number;
	previousValue: number;
	format: {
		style: 'percent' | 'decimal';
		signDisplay?: 'never' | 'always';
		maximumFractionDigits?: number;
	};
	primary?: boolean;
}

export const Tile: FC< TileProps > = ( {
	className,
	title,
	subtitle,
	infoTooltip,
	currentValue,
	previousValue,
	format,
	primary,
} ) => {
	const comparisonDays = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeNumberOfDays(),
		[]
	);

	return (
		<GoalTile
			baseClassName="googlesitekit-site-goals-tile"
			className={ classnames( className, {
				'googlesitekit-site-goals-tile--primary': primary,
				'googlesitekit-site-goals-tile--primary__positive':
					primary && currentValue > previousValue,
				'googlesitekit-site-goals-tile--primary__negative':
					primary && currentValue < previousValue,
			} ) }
			title={ title }
			infoTooltip={ infoTooltip }
		>
			<div className="googlesitekit-site-goals-tile__metric-container">
				<div className="googlesitekit-site-goals-tile__metric">
					{ numFmt( currentValue, format ) }
				</div>
				<p className="googlesitekit-site-goals-tile__subtext">
					{ subtitle }
				</p>
			</div>
			<div className="googlesitekit-site-goals-tile__change-container">
				<ChangeBadge
					previousValue={ previousValue }
					currentValue={ currentValue }
				/>
				{ comparisonDays && previousValue !== 0 && (
					<p className="googlesitekit-site-goals-tile__comparison-label">
						{ sprintf(
							/* translators: %d: number of days in the comparison period */
							__( 'Vs. prev. %d days', 'google-site-kit' ),
							comparisonDays
						) }
					</p>
				) }
			</div>
		</GoalTile>
	);
};
