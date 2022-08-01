/**
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ImageRadio from '../../../../components/ImageRadio';

export const TYPE_OVERLAY = 'overlay';
export const TYPE_FIXED = 'fixed';

export default function TypeRadio( props ) {
	const { defaultType = TYPE_OVERLAY, onUpdate } = props;

	const [ type, setType ] = useState( defaultType );

	const onChange = useCallback(
		( { target } ) => {
			const { value } = target || {};

			setType( value );
			onUpdate?.( value );
		},
		[ setType, onUpdate ]
	);

	return (
		<div className="googlesitekit-twg-setting-field googlesitekit-twg-type-radio">
			<h4>{ __( 'Type', 'google-site-kit' ) }</h4>
			<div className="googlesitekit-twg-type-radio__options">
				<ImageRadio
					id={ `type-${ TYPE_OVERLAY }` }
					name="type"
					value={ TYPE_OVERLAY }
					checked={ TYPE_OVERLAY === type }
					label={ __( 'Overlay', 'google-site-kit' ) }
					description={ __(
						'Stays in view as the user scrolls',
						'google-site-kit'
					) }
					onChange={ onChange }
				/>
				<ImageRadio
					id={ `type-${ TYPE_FIXED }` }
					name="type"
					value={ TYPE_FIXED }
					checked={ TYPE_FIXED === type }
					label={ __( 'Fixed', 'google-site-kit' ) }
					description={ __(
						'Stays in position and goes out of view as the user scrolls',
						'google-site-kit'
					) }
					onChange={ onChange }
				/>
			</div>
		</div>
	);
}

TypeRadio.propTypes = {
	defaultType: PropTypes.string,
	onUpdate: PropTypes.func,
};
