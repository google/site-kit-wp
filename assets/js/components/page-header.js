/**
 * PageHeader component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

function PageHeader( props ) {
	const { title, icon, className, status, statusText, fullWidth, children } = props;

	const widthClasses = fullWidth
		? `
		mdc-layout-grid__cell
		mdc-layout-grid__cell--span-12
		`
		: `
		mdc-layout-grid__cell
		mdc-layout-grid__cell--span-4-phone
		mdc-layout-grid__cell--span-4-tablet
		mdc-layout-grid__cell--span-6-desktop
		`;

	// Determine whether the details cell should display.
	const hasDetails = '' !== status || Boolean( children );

	return (
		<header className="googlesitekit-page-header">
			<div className="mdc-layout-grid__inner">
				{ title &&
					<div className={ widthClasses }>
						{ icon }
						<h1 className={ classnames(
							'googlesitekit-page-header__title',
							className
						) }>
							{ title }
						</h1>
					</div>
				}
				{ hasDetails &&
					<div className="
						mdc-layout-grid__cell
						mdc-layout-grid__cell--align-bottom
						mdc-layout-grid__cell--align-right-tablet
						mdc-layout-grid__cell--span-4-phone
						mdc-layout-grid__cell--span-4-tablet
						mdc-layout-grid__cell--span-6-desktop
					">
						<div className="googlesitekit-page-header__details">
							{ status &&
								<span className={ classnames(
									'googlesitekit-page-header__status',
									`googlesitekit-page-header__status--${ status }`
								) }>
									{ statusText }
								</span>
							}
							{ props.children }
						</div>
					</div>
				}
			</div>
		</header>
	);
}

PageHeader.propTypes = {
	title: PropTypes.string,
	icon: PropTypes.node,
	iconID: PropTypes.string,
	className: PropTypes.string,
	status: PropTypes.string,
	statusText: PropTypes.string,
	fullWidth: PropTypes.bool,
};

PageHeader.defaultProps = {
	title: '',
	icon: null,
	iconID: '',
	iconWidth: '',
	iconHeight: '',
	className: 'googlesitekit-heading-3',
	status: '',
	statusText: '',
	fullWidth: false,
};

export default PageHeader;
