/**
 * User Input Congrats.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { Cell, Row } from '../../material-components';
import Link from '../link';
import highFiveImage from '../../../images/highfive.png';
const { useSelect } = Data;

export default function UserInputCongrats() {
	const dashboardURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ) );

	return (
		<div className="googlesitekit-user-input__congrats">
			<Row>
				<Cell lg={ 2 } md={ 2 } sm={ 1 }>
					<img src={ global._googlesitekitLegacyData.admin.assetsRoot + highFiveImage } alt="" />
				</Cell>

				<Cell lg={ 10 } md={ 6 } sm={ 3 }>
					<Row>
						<Cell lg={ 4 }>
							<h1>
								{ __( 'Congrats! You set your site goals.', 'google-site-kit' ) }
							</h1>
						</Cell>

						<Cell lg={ 8 }>
							<p>
								{ __( 'Based on your goals, now Site Kit will begin showing you suggestions how to add more metrics to your dashboard that are relevant specifically to you.', 'google-site-kit' ) }
							</p>

							<Link href={ dashboardURL }>
								{ __( 'OK, got it', 'google-site-kit' ) }
							</Link>
						</Cell>
					</Row>
				</Cell>
			</Row>
		</div>
	);
}
