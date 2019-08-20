/**
 * DashboardSplashService component.
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
/**
 * Internal dependencies
 */
import Link from '../link';

const { Component } = wp.element;

class DashboardSplashService extends Component {
	render() {
		const imagePath = googlesitekit.admin.assetsRoot + 'images/';
		const { image, title, content, link, linkText, opposite } = this.props;

		return (
			<div className={ `googlesitekit-splash-service ${ opposite ? 'googlesitekit-splash-service--opposite' : '' }` } style={ { backgroundImage: `url(${ imagePath }service-${ image }.jpg)` } }>
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className={ `
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-5-tablet
							mdc-layout-grid__cell--span-7-desktop
							${ opposite ? 'mdc-layout-grid__cell--start-3-tablet mdc-layout-grid__cell--start-5-desktop mdc-layout-grid__cell--offset-5-tablet' : '' }
						` }>
							<div className="googlesitekit-splash-service__content">
								<h3 className="
									googlesitekit-heading-2
									googlesitekit-splash-service__title
								">
									{ title }
								</h3>
								<p className="googlesitekit-splash-service__text">
									{ content }
								</p>
								<Link href={ link } caps external arrow>{ linkText }</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

DashboardSplashService.propTypes = {
	image: PropTypes.string,
	title: PropTypes.string,
	content: PropTypes.string,
	link: PropTypes.string,
	linkText: PropTypes.string,
	opposite: PropTypes.bool,
};

DashboardSplashService.defaultProps = {
	image: '',
	title: '',
	content: '',
	link: '',
	linkText: '',
	opposite: false,
};

export default DashboardSplashService;
