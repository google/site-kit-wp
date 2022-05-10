/**
 * EmptyPieChart component
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import EmptyIcon from '../../../../../../svg/graphics/zero-state-blue.svg';
import { Cell, Grid, Row } from '../../../../../material-components';
import { ZeroDataMessage } from '../../common';

export default function EmptyPieChart() {
	return (
		<Grid className="googlesitekit-widget--analyticsAllTraffic__empty-dimensions-chart">
			<Row>
				<Cell size={ 12 }>
					<EmptyIcon />
				</Cell>
				<Cell size={ 12 }>
					<h4>{ __( 'No data to display', 'google-site-kit' ) }</h4>
					<p>
						<ZeroDataMessage skipPrefix />
					</p>
				</Cell>
			</Row>
		</Grid>
	);
}
