/**
 * Audience Segmentation Get Help Link component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import SourceLink from '../../../../../components/SourceLink';
import useViewOnly from '../../../../../hooks/useViewOnly';
const { useSelect } = Data;

export default function AudienceAreaFooter() {
	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const sourceLinkURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getServiceReportURL( 'audiences', {
			dates,
		} );
	} );

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	if ( ! isAnalyticsConnected ) {
		return null;
	}

	return (
		<SourceLink
			className="googlesitekit-audience-widget__source"
			name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			href={ sourceLinkURL }
			external
		/>
	);
}
