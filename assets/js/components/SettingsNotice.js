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

/**
 * Internal dependencies
 */
import InfoIcon from '../../svg/info-icon.svg';
import SuggestionIcon from '../../svg/suggestion-icon.svg';
import WarningIcon from '../../svg/warning-icon.svg';

export const TYPE_WARNING = 'warning';
export const TYPE_INFO = 'info';
export const TYPE_SUGGESTION = 'suggestion';

const getIconFromType = ( type ) => {
	switch ( type ) {
		case 'warning':
			return <WarningIcon />;
		case 'info':
			return <InfoIcon />;
		case 'suggestion':
			return <SuggestionIcon />;
		default:
			return null;
	}
};

export default function SettingsNotice( { children, type, Icon, LearnMore } ) {
	return (
		<div className={ classnames(
			'googlesitekit-settings-notice',
			`googlesitekit-settings-notice--${ type }`
		) } >

			<div className="googlesitekit-settings-notice__icon">
				{ Icon ? <Icon /> : getIconFromType( type ) }
			</div>
			<div className="googlesitekit-settings-notice__text">
				{ LearnMore && (
					<div className="googlesitekit-settings-notice__learn-more">
						<LearnMore />
					</div>
				) }
				{ children }
			</div>
		</div>
	);
}

SettingsNotice.propTypes = {
	children: PropTypes.node.isRequired,
	type: PropTypes.oneOf( [ 'warning', 'info', 'suggestion' ] ),
	Icon: PropTypes.elementType,
	LearnMore: PropTypes.elementType,
};

SettingsNotice.defaultProps = {
	type: TYPE_WARNING,
	Icon: null,
	LearnMore: null,
};
