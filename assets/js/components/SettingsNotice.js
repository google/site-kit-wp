/**
 * Settings notice component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

export default function SettingsNotice( { children, type } ) {
	return (
		<div
			className={ classnames(
				'googlesitekit-settings-notice',
				`googlesitekit-settings-notice--${ type }`
			) }
		>
			<div className="googlesitekit-settings-notice__text">
				{ children }
			</div>
		</div>
	);
}

SettingsNotice.propTypes = {
	children: PropTypes.node.isRequired,
	type: PropTypes.string,
};

SettingsNotice.defaultProps = {
	type: TYPE_WARNING,
};
