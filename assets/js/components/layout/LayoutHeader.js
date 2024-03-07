/**
 * LayoutHeader component.
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
import Link from '../Link';

class LayoutHeader extends Component {
	render() {
		const { title, badge, ctaLabel, ctaLink } = this.props;

		const titleCellProps = ctaLink
			? {
					alignMiddle: true,
					smSize: 4,
					lgSize: 6,
			  }
			: {
					alignMiddle: true,
					smSize: 4,
					mdSize: 8,
					lgSize: 12,
			  };

		return (
			<header className="googlesitekit-layout__header">
				<Grid>
					<Row>
						{ title && (
							<Cell { ...titleCellProps }>
								<h3 className="googlesitekit-subheading-1 googlesitekit-layout__header-title">
									{ title }
									{ badge }
								</h3>
							</Cell>
						) }
						{ ctaLink && (
							<Cell
								alignMiddle
								mdAlignRight
								smSize={ 4 }
								lgSize={ 6 }
							>
								<Link href={ ctaLink } external>
									{ ctaLabel }
								</Link>
							</Cell>
						) }
					</Row>
				</Grid>
			</header>
		);
	}
}

LayoutHeader.propTypes = {
	title: PropTypes.string,
	badge: PropTypes.node,
	ctaLabel: PropTypes.string,
	ctaLink: PropTypes.string,
};

LayoutHeader.defaultProps = {
	title: '',
	badge: null,
	ctaLabel: '',
	ctaLink: '',
};

export default LayoutHeader;
