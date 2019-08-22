/**
 * LayoutHeader component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import Link from 'GoogleComponents/link';

import { Component } from '@wordpress/element';

class LayoutHeader extends Component {
	render() {
		const { title, ctaLabel, ctaLink } = this.props;
		return (
			<header className="googlesitekit-layout__header">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						{ title &&
							<div
								className={ `
									mdc-layout-grid__cell
									${ ctaLink ? 'mdc-layout-grid__cell--span-6-desktop' : 'mdc-layout-grid__cell--span-12-desktop' }
									mdc-layout-grid__cell--align-middle
									${ ctaLink ? '' : 'mdc-layout-grid__cell--span-8-tablet' }
									mdc-layout-grid__cell--span-4-phone
								` }>
								<h3 className="googlesitekit-subheading-1 googlesitekit-layout__header-title">
									{ title }
								</h3>
							</div>
						}
						{ ctaLink &&
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-6-desktop
								mdc-layout-grid__cell--span-4-phone
								mdc-layout-grid__cell--align-middle
								mdc-layout-grid__cell--align-right-tablet
							">
								<Link href={ ctaLink } external inherit>
									{ ctaLabel }
								</Link>
							</div>
						}
					</div>
				</div>
			</header>
		);
	}
}

LayoutHeader.propTypes = {
	title: PropTypes.string,
	ctaLabel: PropTypes.string,
	ctaLink: PropTypes.string,
};

LayoutHeader.defaultProps = {
	title: '',
	ctaLabel: '',
	ctaLink: '',
};

export default LayoutHeader;
