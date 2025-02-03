/**
 * Chip component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { Chip as MuiChip, ChipCheckmark } from '@material/react-chips';
import classnames from 'classnames';
import PropTypes from 'prop-types';

export default function Chip( {
	id,
	label,
	onClick,
	selected,
	className,
	CheckMark = ChipCheckmark,
	...props
} ) {
	return (
		<MuiChip
			chipCheckmark={ <CheckMark /> }
			data-chip-id={ id }
			id={ id }
			label={ label }
			onClick={ onClick }
			selected={ selected }
			className={ classnames( 'googlesitekit-chip', className ) }
			{ ...props }
		/>
	);
}

Chip.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	onClick: PropTypes.func,
	selected: PropTypes.bool,
	className: PropTypes.string,
	CheckMark: PropTypes.elementType,
};
