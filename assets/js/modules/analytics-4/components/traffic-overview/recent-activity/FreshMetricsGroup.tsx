/**
 * Recent activity fresh metrics group.
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
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import InfoTooltip from '@/js/components/InfoTooltip';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
import { ErrorObject } from '@/js/util/errors';
import RecentActivityErrorNotice from './RecentActivityErrorNotice';

export interface FreshMetricsGroupProps {
	/** The heading of the group, e.g. `Search performance`. */
	title: string;
	/** The content of the info tooltip next to the heading. */
	infoTooltip?: ReactNode;
	/** The slug of the module the figures come from. */
	moduleSlug: string;
	/** The error of the group's report, shown in place of the figures. */
	error?: ErrorObject;
	/** Requests the group's report again after an error. */
	onRetry: () => void;
}

const FreshMetricsGroup: FC< FreshMetricsGroupProps > = ( {
	title,
	infoTooltip,
	moduleSlug,
	error,
	onRetry,
	children,
} ) => {
	return (
		<section>
			<div className="googlesitekit-traffic-overview__fresh-metrics-group-header">
				<Typography
					as="h3"
					type={ TYPE_TITLE }
					size={ SIZE_MEDIUM }
					className="googlesitekit-traffic-overview__fresh-metrics-group-heading"
				>
					{ title }
				</Typography>
				<InfoTooltip
					title={ infoTooltip }
					tooltipClassName="googlesitekit-traffic-overview__fresh-metrics-tooltip"
				/>
			</div>
			{ error ? (
				<RecentActivityErrorNotice
					moduleSlug={ moduleSlug }
					error={ error }
					onRetry={ onRetry }
				/>
			) : (
				<div className="googlesitekit-traffic-overview__fresh-metrics">
					{ children }
				</div>
			) }
		</section>
	);
};

export default FreshMetricsGroup;
