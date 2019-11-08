/**
 * DashboardSplashIntro component.
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
import Button from 'GoogleComponents/button';
import Logo from 'GoogleComponents/logo';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class DashboardSplashIntro extends Component {
	render() {
		const {
			title,
			description,
			buttonLabel,
			onButtonClick,
		} = this.props;

		const twoColumns = buttonLabel && onButtonClick;

		const mainColumnClassName = `mdc-layout-grid__cell mdc-layout-grid__cell--span-${ twoColumns ? '4' : '8' }-tablet mdc-layout-grid__cell--span-${ twoColumns ? '6' : '12' }-desktop`;

		return (
			<section className="googlesitekit-splash-intro">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className={ mainColumnClassName }>
							<Logo />
							<h1 className="googlesitekit-splash-intro__title">
								{ title }
							</h1>
							{ description &&
								<p className="googlesitekit-splash-intro__text">
									{ description }
								</p>
							}
						</div>
						{ twoColumns &&
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--align-middle
								mdc-layout-grid__cell--span-3-tablet
								mdc-layout-grid__cell--span-5-desktop
								mdc-layout-grid__cell--start-5-tablet
								mdc-layout-grid__cell--start-7-desktop
								mdc-layout-grid__cell--offset-1
							">
								<div className="googlesitekit-splash-intro__button">
									<Button onClick={ onButtonClick }>
										{ buttonLabel }
									</Button>
								</div>
							</div>
						}
					</div>
				</div>
			</section>
		);
	}
}

DashboardSplashIntro.propTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	buttonLabel: PropTypes.string,
	onButtonClick: PropTypes.func,
};

DashboardSplashIntro.defaultProps = {
	title: __( 'Welcome to Site Kit.', 'google-site-kit' ),
};

export default DashboardSplashIntro;
