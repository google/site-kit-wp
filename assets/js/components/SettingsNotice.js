/**
 * Settings notice component.
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

export const TYPE_WARNING = 'warning';
export const TYPE_INFO = 'info';
export const TYPE_SUGGESTION = 'suggestion';

export default function SettingsNotice( { children, type, Icon, LearnMore } ) {
	return (
		<div className="mdc-layout-grid">
			<div className={ classnames(
				'mdc-layout-grid__inner',
				'googlesitekit-settings-notice',
				`googlesitekit-settings-notice--${ type }`
			) } >
				<div className="mdc-layout-grid__cell--span-8-desktop
								mdc-layout-grid__cell--span-8-tablet
								mdc-layout-grid__cell--span-4-phone">
					<div className="mdc-layout-grid__inner">
						<div className="mdc-layout-grid__cell--span-1-desktop
										mdc-layout-grid__cell--span-1-tablet
										mdc-layout-grid__cell--span-1-phone
										mdc-layout-grid__cell--align-right">
							{ Icon }
						</div>
						<div className="mdc-layout-grid__cell--span-11-desktop
										mdc-layout-grid__cell--span-7-tablet
										mdc-layout-grid__cell--span-3-phone
										googlesitekit-settings-notice__text">
							{ children }
						</div>
					</div>
				</div>
				<div className="mdc-layout-grid__cell--span-4-desktop
								mdc-layout-grid__cell--span-8-tablet
								mdc-layout-grid__cell--span-4-phone
								mdc-layout-grid__cell--align-right
								mdc-layout-grid__cell--align-bottom
								googlesitekit-settings-notice__text
								googlesitekit-settings-notice__learn-more">
					{ LearnMore() }
				</div>
			</div>
		</div>
	);
}

SettingsNotice.propTypes = {
	children: PropTypes.node.isRequired,
	type: PropTypes.string,
	Icon: PropTypes.element,
	LearnMore: PropTypes.func,
};

SettingsNotice.defaultProps = {
	type: TYPE_WARNING,
	Icon: null,
	LearnMore: () => {},
};
