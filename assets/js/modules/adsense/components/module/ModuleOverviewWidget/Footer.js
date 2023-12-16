/**
 * Footer component for ModuleOverviewWidget.
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
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	MODULES_ADSENSE,
	DATE_RANGE_OFFSET,
} from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { generateDateRangeArgs } from '../../../util/report-date-range-args';
import SourceLink from '../../../../../components/SourceLink';
import Data from 'googlesitekit-data';
import useViewOnly from '../../../../../hooks/useViewOnly';
const { useSelect } = Data;

function Footer() {
	const viewOnlyDashboard = useViewOnly();

	const dateRangeDates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const accountSiteURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ADSENSE ).getServiceReportURL(
			generateDateRangeArgs( dateRangeDates )
		);
	} );

	return (
		<SourceLink
			href={ accountSiteURL }
			name={ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
			external
		/>
	);
}

export default Footer;
