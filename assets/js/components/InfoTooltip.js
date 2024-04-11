/**
 * InfoTooltip component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { Tooltip } from 'googlesitekit-components';
import InfoIcon from '../../svg/icons/info-green.svg';

export default function InfoTooltip( { title, tooltipClassName = '' } ) {
	if ( ! title ) {
		return null;
	}

	return (
		<Tooltip
			className="googlesitekit-info-tooltip"
			tooltipClassName={ `googlesitekit-info-tooltip__content ${ tooltipClassName }` }
			title={ title }
			placement="top"
			enterTouchDelay={ 0 }
			leaveTouchDelay={ 5000 }
			interactive
		>
			<span>
				<InfoIcon width="16" height="16" />
			</span>
		</Tooltip>
	);
}

InfoTooltip.propTypes = {
	title: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	tooltipClassName: PropTypes.string,
};
