/**
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
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../../../material-components';

export default function SingleColumnNotificationWithSVG( {
	id,
	title,
	description,
	actions,
	SVG,
} ) {
	return (
		<div className="googlesitekit-widget-context">
			<Grid className="googlesitekit-widget-area">
				<Row>
					<Cell size={ 12 }>
						<div
							className={ classNames(
								'googlesitekit-widget',
								'googlesitekit-widget--no-padding',
								'googlesitekit-setup-cta-banner',
								'googlesitekit-setup-cta-banner--single-column',
								`googlesitekit-setup-cta-banner--${ id }`
							) }
						>
							<div className="googlesitekit-setup-cta-banner__cells">
								<div className="googlesitekit-setup-cta-banner__primary-cell">
									<h3 className="googlesitekit-setup-cta-banner__title">
										{ title }
									</h3>

									{ description }

									{ actions }
								</div>
								<div
									className={ classNames(
										`googlesitekit-setup-cta-banner__svg-wrapper--${ id }`
									) }
								>
									<SVG />
								</div>
							</div>
						</div>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}
