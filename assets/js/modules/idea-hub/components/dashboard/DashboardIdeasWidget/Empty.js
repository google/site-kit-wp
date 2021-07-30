/**
 * Empty component
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { Grid, Cell, Row } from '../../../../../material-components';

const Empty = ( { sideLayout, Icon, title, subtitle } ) => {
	return (
		<div className={ classnames( 'googlesitekit-idea-hub__empty', {
			'googlesitekit-idea-hub__empty--layout-side': sideLayout,
			'googlesitekit-idea-hub__empty--layout-stacked': ! sideLayout,
		} ) }>
			<Grid>
				<Row>
					<Cell size={ sideLayout ? 4 : 12 } className="googlesitekit-idea-hub__empty--icon">
						{ Icon }
					</Cell>

					<Cell size={ sideLayout ? 8 : 12 } className="googlesitekit-idea-hub__empty--details">
						<h4 className="googlesitekit-idea-hub__empty--title">{ title }</h4>

						{ subtitle && <p className="googlesitekit-idea-hub__empty--subtitle">{ subtitle }</p> }
					</Cell>
				</Row>
			</Grid>
		</div>
	);
};

Empty.propTypes = {
	sideLayout: PropTypes.bool,
	Icon: PropTypes.element.isRequired,
	title: PropTypes.string.isRequired,
	subtitle: PropTypes.string,
};

Empty.defaultProps = {
	sideLayout: true,
};

export default Empty;
