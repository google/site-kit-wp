/**
 * SelectionBox component.
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
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';

export default function SelectionBox( {
	badge,
	checked,
	children,
	disabled,
	id,
	onChange,
	title,
	value,
} ) {
	return (
		<div
			className={ classnames( 'googlesitekit-selection-box', {
				'googlesitekit-selection-box--disabled': disabled,
			} ) }
		>
			<Checkbox
				checked={ checked }
				description={ children }
				disabled={ disabled }
				id={ id }
				name={ id }
				onChange={ onChange }
				value={ value }
			>
				{ title }
				{ badge }
			</Checkbox>
		</div>
	);
}

SelectionBox.propTypes = {
	badge: PropTypes.node,
	checked: PropTypes.bool,
	children: PropTypes.node,
	disabled: PropTypes.bool,
	id: PropTypes.string,
	onChange: PropTypes.func,
	title: PropTypes.string,
	value: PropTypes.string,
};
