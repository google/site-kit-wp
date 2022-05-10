/**
 * LayoutFooter component.
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

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../material-components';
import SourceLink from '../SourceLink';

class LayoutFooter extends Component {
	render() {
		const { ctaLabel, ctaLink, footerContent } = this.props;
		return (
			<footer className="googlesitekit-layout__footer">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							{ ctaLink && ctaLabel && (
								<SourceLink
									className="googlesitekit-data-block__source"
									name={ ctaLabel }
									href={ ctaLink }
									external
								/>
							) }
							{ footerContent }
						</Cell>
					</Row>
				</Grid>
			</footer>
		);
	}
}

LayoutFooter.propTypes = {
	ctaLabel: PropTypes.string,
	ctaLink: PropTypes.string,
};

export default LayoutFooter;
