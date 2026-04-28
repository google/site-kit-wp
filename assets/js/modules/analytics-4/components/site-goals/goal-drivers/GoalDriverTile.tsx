/**
 * Site Goals Goal Driver Tile component.
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
import type { FC, ReactElement, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MetricTileTable from '@/js/components/KeyMetrics/MetricTileTable';
import Link from '@/js/components/Link';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import { GOAL_TYPES } from './constants';
import type { GoalDriverComponentProps, GoalDriverRow } from './types';

interface InlineTileWidgetProps {
	children: ReactNode;
}

function InlineTileWidget( { children }: InlineTileWidgetProps ) {
	return children as ReactElement;
}

interface GoalDriverTileProps extends GoalDriverComponentProps {
	title: string;
	headerLabel?: string;
}

interface LabelCellProps {
	row: GoalDriverRow;
	fieldValue?: unknown;
}

function LabelCell( { row, fieldValue }: LabelCellProps ): ReactElement {
	const label = String( fieldValue ?? '' );

	if ( row.url ) {
		return (
			<Link
				href={ row.url }
				title={ label }
				external
				hideExternalIndicator
			>
				{ label }
			</Link>
		);
	}

	return <span>{ label }</span>;
}

const GoalDriverTile: FC< GoalDriverTileProps > = ( {
	title,
	headerLabel,
	rows = [],
	loading = false,
	error,
	limit,
	goalType,
} ) => {
	const goalLabel =
		goalType === GOAL_TYPES.ECOMMERCE
			? __( 'sales', 'google-site-kit' )
			: __( 'leads', 'google-site-kit' );

	function ZeroState() {
		return <ZeroDataMessage metricLabel={ goalLabel } />;
	}

	return (
		<div className="googlesitekit-site-goals-goal-driver">
			<MetricTileTable
				Widget={ InlineTileWidget }
				title={ title }
				headerLabel={ headerLabel }
				moduleSlug="analytics-4"
				rows={ rows }
				columns={ [
					{
						field: 'label',
						Component: LabelCell,
						className:
							'googlesitekit-site-goals-goal-driver__cell googlesitekit-site-goals-goal-driver__cell--label',
					},
					{
						field: 'value',
						className:
							'googlesitekit-site-goals-goal-driver__cell googlesitekit-site-goals-goal-driver__cell--value',
					},
				] }
				loading={ loading }
				error={ error }
				limit={ limit }
				ZeroState={ ZeroState }
			/>
		</div>
	);
};

export default GoalDriverTile;
