/**
 * Footer component of the ModulePopularPagesWidgetGA4 widget.
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
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import SourceLink from '../../../../../components/SourceLink';
import useViewOnly from '../../../../../hooks/useViewOnly';

export default function Footer() {
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

		return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
			'all-pages-and-screens',
			{
				dates,
				// eslint-disable-next-line sitekit/acronym-case
				otherArgs: { collectionId: 'life-cycle' },
			}
		);
	} );

	return (
		<SourceLink
			href={ sourceLinkURL }
			name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			external
		/>
	);
}
