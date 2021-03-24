/**
 * Header component of the ModulePopularPagesWidget widget.
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
import { sprintf, _n, _x, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { getCurrentDateRangeDayCount } from '../../../../../util/date-range';
import { MODULES_ANALYTICS } from '../../../datastore/constants';
import { Cell, Grid, Row } from '../../../../../material-components';
import Link from '../../../../../components/Link';
const { useSelect } = Data;

export default function Header() {
	const visitorsOverview = useSelect( ( select ) => select( MODULES_ANALYTICS ).getServiceReportURL( 'visitors-overview' ) );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const currentDayCount = getCurrentDateRangeDayCount( dateRange );

	const title = sprintf(
		/* translators: %s: number of days */
		_n( 'Top content over the last %s day', 'Top content over the last %s days', currentDayCount, 'google-site-kit', ),
		currentDayCount
	);

	const headerCTALabel = sprintf(
		/* translators: %s: module name. */
		__( 'See full stats in %s', 'google-site-kit' ),
		_x( 'Analytics', 'Service name', 'google-site-kit' )
	);

	return (
		<Grid>
			<Row>
				<Cell lgSize={ 6 } mdSize={ 4 } smSize={ 4 } alignMiddle>
					<h3 className="googlesitekit-subheading-1 googlesitekit-widget__header-title">
						{ title }
					</h3>
				</Cell>

				<Cell className="mdc-layout-grid__cell--align-right-tablet" lgSize={ 6 } mdSize={ 4 } smSize={ 4 } alignMiddle>
					<Link href={ visitorsOverview } external inherit>
						{ headerCTALabel }
					</Link>
				</Cell>
			</Row>
		</Grid>
	);
}
