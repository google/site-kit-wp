/**
 * AdBlockingRecoveryApp component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Header from '../../../../../components/Header';
import HelpMenu from '../../../../../components/help/HelpMenu';
import { Cell, Grid, Row } from '../../../../../material-components';
import SetupMain from './SetupMain';

export default function AdBlockingRecoveryApp() {
	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>
			<div className="googlesitekit-ad-blocking-recovery googlesitekit-module-page">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<SetupMain />
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}
