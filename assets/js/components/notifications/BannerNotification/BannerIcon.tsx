/**
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
import Warning from '../../../../svg/icons/warning.svg';
import ErrorIcon from '../../../../svg/icons/error.svg';
import { Cell } from '../../../material-components';
import { BannerIconProps } from './types';

export default function BannerIcon( props: BannerIconProps ) {
	const { type } = props;

	if ( 'win-error' !== type && 'win-warning' !== type ) {
		return null;
	}

	const icon =
		'win-warning' === type ? (
			<Warning width={ 34 } />
		) : (
			<ErrorIcon width={ 28 } />
		);

	return (
		<Cell size={ 1 } smOrder={ 3 } mdOrder={ 3 } lgOrder={ 3 }>
			<div className="googlesitekit-publisher-win__icons">{ icon }</div>
		</Cell>
	);
}

BannerIcon.propTypes = {
	type: PropTypes.string,
};
