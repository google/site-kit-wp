/**
 * Chip component.
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
import propTypes from 'prop-types';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import {
	KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG,
	KEY_METRICS_SUGGESTED_GROUP_SLUG,
} from '../constants';
import CheckMark from '../../../../svg/icons/check-2.svg';
import StarFill from '../../../../svg/icons/star-fill.svg';
import Null from '../../../components/Null';

const icons = {
	[ KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG ]: CheckMark,
	[ KEY_METRICS_SUGGESTED_GROUP_SLUG ]: StarFill,
};

export default function Chip( {
	slug,
	label,
	isActive,
	onClick,
	selectedCount = 0,
} ) {
	const Icon = icons[ slug ] || Null;

	return (
		<Button
			className={ classnames( 'googlesitekit-chip-tab-group__chip-item', {
				'googlesitekit-chip-tab-group__chip-item--active': isActive,
			} ) }
			icon={
				<Icon
					width={ 12 }
					height={ 12 }
					className={ `googlesitekit-chip-tab-group__chip-item-svg googlesitekit-chip-tab-group__chip-item-svg__${ slug }` }
				/>
			}
			trailingIcon={
				selectedCount > 0 ? (
					<span className="googlesitekit-chip-tab-group__chip-item-count">
						({ selectedCount })
					</span>
				) : null
			}
			onClick={ () => onClick( slug ) }
		>
			{ label }
		</Button>
	);
}

Chip.propTypes = {
	slug: propTypes.string.isRequired,
	label: propTypes.string.isRequired,
	isActive: propTypes.bool,
	selectedCount: propTypes.number,
	onClick: propTypes.func.isRequired,
};
