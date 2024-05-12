/**
 * Selection Panel Header component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import Link from '../Link';
import CloseIcon from '../../../svg/icons/close.svg';

export default function SelectionPanelHeader( {
	children,
	title,
	onCloseClick,
} ) {
	return (
		<header className="googlesitekit-selection-panel-header">
			<div className="googlesitekit-selection-panel-header__row">
				<h3>{ title }</h3>
				<Link
					className="googlesitekit-selection-panel-header__close"
					onClick={ onCloseClick }
					linkButton
				>
					<CloseIcon width="15" height="15" />
				</Link>
			</div>
			{ children }
		</header>
	);
}

SelectionPanelHeader.propTypes = {
	children: PropTypes.node,
	title: PropTypes.string,
	onCloseClick: PropTypes.func,
};
