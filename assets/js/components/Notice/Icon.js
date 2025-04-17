/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import Null from '../Null';
import CheckFill from '../../../svg/icons/check-fill.svg';
import WarningSVG from '../../../svg/icons/warning.svg';
import StarFill from '../../../svg/icons/star-fill.svg';
import { TYPES } from './constants';

const typeIconMap = {
	[ TYPES.NEW ]: StarFill,
	[ TYPES.SUCCESS ]: CheckFill,
	[ TYPES.INFO ]: WarningSVG,
	[ TYPES.WARNING ]: WarningSVG,
	[ TYPES.ERROR ]: WarningSVG,
};

export default function Icon( { className, type } ) {
	const IconComponent = typeIconMap[ type ] || null;

	if ( ! IconComponent ) {
		return Null;
	}

	return (
		<div
			className={ classnames( 'googlesitekit-notice__icon', className ) }
		>
			<IconComponent width={ 24 } height={ 24 } />
		</div>
	);
}

Icon.propTypes = {
	className: PropTypes.string,
	type: PropTypes.oneOf( Object.values( TYPES ) ),
};
