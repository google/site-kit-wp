/**
 * Header component for ModuleAcquisitionChannelsWidget component.
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
import { sprintf, _x, __, _n } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS, DATE_RANGE_OFFSET } from '../../../datastore/constants';
import WidgetHeaderTitle from '../../../../../googlesitekit/widgets/components/WidgetHeaderTitle';
import WidgetHeaderCTA from '../../../../../googlesitekit/widgets/components/WidgetHeaderCTA';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { generateDateRangeArgs } from '../../../util/report-date-range-args';
const { useSelect } = Data;

export default function Header() {
	const dates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} ) );
	const url = useSelect( ( select ) => select( MODULES_ANALYTICS ).getServiceReportURL(
		'trafficsources-overview',
		generateDateRangeArgs( dates )
	) );
	const dateRangeNumberOfDays = useSelect( ( select ) => select( CORE_USER ).getDateRangeNumberOfDays() );
	const title = sprintf(
		/* translators: %s: number of days */
		_n( 'Top acquisition channels over the last %s day', 'Top acquisition channels over the last %s days', dateRangeNumberOfDays, 'google-site-kit', ),
		dateRangeNumberOfDays,
	);

	const headerCTALabel = sprintf(
		/* translators: %s: module name. */
		__( 'See full stats in %s', 'google-site-kit' ),
		_x( 'Analytics', 'Service name', 'google-site-kit' )
	);

	return (
		<Fragment>
			<WidgetHeaderTitle title={ title } />
			<WidgetHeaderCTA href={ url } label={ headerCTALabel } external />
		</Fragment>
	);
}
