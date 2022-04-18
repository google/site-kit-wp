/**
 * SetupUsingProxyViewOnly component.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Header from '../Header';
import Layout from '../layout/Layout';
import { Grid, Row, Cell } from '../../material-components';
import HelpMenu from '../help/HelpMenu';

export default function SetupUsingProxyViewOnly() {
	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>

			<div className="googlesitekit-setup">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Layout>
								<section className="googlesitekit-setup__splash">
									<Grid>
										<Row className="googlesitekit-setup__content">
											<Cell size={ 12 }>
												<p>
													TODO: UI to view only splash
													page.
												</p>
											</Cell>
										</Row>
									</Grid>
								</section>
							</Layout>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}
