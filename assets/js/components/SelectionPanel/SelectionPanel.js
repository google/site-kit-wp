/**
 * Selection Panel component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import SideSheet from '../SideSheet';

export default function SelectionPanel( {
	children,
	isOpen,
	isLoading,
	onOpen,
	closePanel,
	className,
} ) {
	return (
		<SideSheet
			className={ classnames(
				'googlesitekit-selection-panel',
				className
			) }
			isOpen={ isOpen }
			isLoading={ isLoading }
			onOpen={ onOpen }
			closeSheet={ closePanel }
			focusTrapOptions={ {
				initialFocus: `.${ className } .googlesitekit-selection-panel-item .googlesitekit-selection-box input`,
			} }
		>
			{ children }
		</SideSheet>
	);
}

SelectionPanel.propTypes = {
	children: PropTypes.node,
	isOpen: PropTypes.bool,
	isLoading: PropTypes.bool,
	onOpen: PropTypes.func,
	closePanel: PropTypes.func,
	className: PropTypes.string.isRequired,
};
