/**
 * Recent activity fresh metrics row.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import SearchPerformanceMetrics from './SearchPerformanceMetrics';
import SiteTrafficMetrics from './SiteTrafficMetrics';
import { getFreshDataWindowStart } from './utils/getFreshDataWindow';

const FreshMetricsRow: FC = () => {
	const viewOnly = useViewOnly();

	const [ windowStart ] = useState( () =>
		// The reference date has no time of day, so the last 24 hours are
		// counted back from the current time, read once so the report options
		// don't change between renders.
		// eslint-disable-next-line sitekit/no-direct-date
		getFreshDataWindowStart( Date.now() )
	);

	// The Recent activity tab shows this row only when Analytics is
	// connected, and Search Console is always connected.
	const canViewAnalytics = useSelect(
		( select: Select ) =>
			! viewOnly ||
			select( CORE_USER ).canViewSharedModule( MODULE_SLUG_ANALYTICS_4 ),
		[ viewOnly ]
	);

	const canViewSearchConsole = useSelect(
		( select: Select ) =>
			! viewOnly ||
			select( CORE_USER ).canViewSharedModule(
				MODULE_SLUG_SEARCH_CONSOLE
			),
		[ viewOnly ]
	);

	return (
		<div className="googlesitekit-traffic-overview__fresh-metrics-row">
			{ canViewAnalytics && (
				<SiteTrafficMetrics windowStart={ windowStart } />
			) }
			{ canViewSearchConsole && (
				<SearchPerformanceMetrics windowStart={ windowStart } />
			) }
		</div>
	);
};

export default FreshMetricsRow;
