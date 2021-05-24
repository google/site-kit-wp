/**
 * ModulePopularKeywordsWidget footer component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import SourceLink from '../../../../../components/SourceLink';
import { generateDateRangeArgs } from '../../../util/report-date-range-args';

const { useSelect } = Data;

export default function Footer() {
	const { serviceURL } = useSelect( ( select ) => {
		const dateRangeDates = select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } );

		return {
			serviceURL: select( STORE_NAME ).getServiceReportURL( {
				...generateDateRangeArgs( dateRangeDates ),
			} ),
		};
	} );

	return (
		<SourceLink
			className="googlesitekit-data-block__source"
			name={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
			href={ serviceURL }
			external
		/>
	);
}

