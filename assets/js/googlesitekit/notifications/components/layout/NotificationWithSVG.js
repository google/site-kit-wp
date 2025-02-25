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
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import { Cell, Grid, Row } from '../../../../material-components';
import Error from '../common/Error';

export default function NotificationWithSVG( {
	id,
	title,
	description,
	actions,
	SVG,
	primaryCellSizes,
	SVGCellSizes,
} ) {
	const breakpoint = useBreakpoint();

	// Desktop breakpoint.
	let svgSizeProps = {
		mdSize: SVGCellSizes?.md || 8,
		lgSize: SVGCellSizes?.lg || 6,
	};
	// Tablet breakpoint.
	if ( breakpoint === BREAKPOINT_TABLET ) {
		svgSizeProps = { mdSize: SVGCellSizes?.md || 8 };
	}
	// Mobile breakpoint.
	if ( breakpoint === BREAKPOINT_SMALL ) {
		svgSizeProps = { smSize: SVGCellSizes?.sm || 12 };
	}

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
								`googlesitekit-setup-cta-banner--${ id }`
							) }
						>
							<div className="googlesitekit-widget__body">
								<Grid collapsed>
									<Row>
										<Cell
											smSize={
												primaryCellSizes?.sm || 12
											}
											mdSize={ primaryCellSizes?.md || 8 }
											lgSize={ primaryCellSizes?.lg || 6 }
											className="googlesitekit-setup-cta-banner__primary-cell"
										>
											<h3 className="googlesitekit-setup-cta-banner__title">
												{ title }
											</h3>

											{ description }

											<Error id={ id } />
											{ actions }
										</Cell>
										<Cell
											alignBottom
											className={ `googlesitekit-setup-cta-banner__svg-wrapper--${ id }` }
											{ ...svgSizeProps }
										>
											<SVG />
										</Cell>
									</Row>
								</Grid>
							</div>
						</div>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}
