/**
 * Recent activity latest post report error.
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
 * Internal dependencies
 */
import ReportError from '@/js/components/ReportError';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';

interface LatestPostReportErrorProps {
	/** The error of the failed request. */
	error: object;
	/** The module the failed request belongs to. Defaults to Analytics. */
	moduleSlug?: string;
}

const LatestPostReportError: FC< LatestPostReportErrorProps > = ( {
	error,
	moduleSlug = MODULE_SLUG_ANALYTICS_4,
} ) => {
	return (
		<div className="googlesitekit-table-tile__error">
			<ReportError moduleSlug={ moduleSlug } error={ error } />
		</div>
	);
};

export default LatestPostReportError;
