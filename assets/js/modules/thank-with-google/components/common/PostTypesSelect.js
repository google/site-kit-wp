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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Chip } from 'googlesitekit-components';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function PostTypesSelect() {
	const postTypes = useSelect( ( select ) =>
		select( CORE_SITE ).getPostTypes()
	);

	const ctaPostTypes = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCTAPostTypes()
	);

	const { setCTAPostTypes } = useDispatch( MODULES_THANK_WITH_GOOGLE );
	const toggleChip = useCallback(
		( { type, target, keyCode } ) => {
			if ( type === 'keyup' && keyCode !== ENTER ) {
				return;
			}

			const chip = target.closest( '.mdc-chip' );
			const chipID = chip?.dataset?.chipId; // eslint-disable-line sitekit/acronym-case
			if ( ! chipID ) {
				return;
			}

			if ( chipID === 'all' ) {
				if ( ctaPostTypes?.length === postTypes?.length ) {
					setCTAPostTypes( [] );
				} else {
					setCTAPostTypes( postTypes.map( ( { slug } ) => slug ) );
				}
			} else if ( ctaPostTypes?.includes( chipID ) ) {
				setCTAPostTypes(
					ctaPostTypes.filter( ( postType ) => postType !== chipID )
				);
			} else {
				setCTAPostTypes( [ ...( ctaPostTypes || [] ), chipID ] );
			}
		},
		[ ctaPostTypes, postTypes, setCTAPostTypes ]
	);

	const options = postTypes?.map( ( { slug, label } ) => (
		<Chip
			key={ slug }
			id={ slug }
			label={ label }
			onClick={ toggleChip }
			onKeyUp={ toggleChip }
			selected={ ctaPostTypes?.includes( slug ) }
		/>
	) );

	return (
		<div className="googlesitekit-twg-setting-field googlesitekit-twg-post-type-select">
			<h4>{ __( 'Post types', 'google-site-kit' ) }</h4>
			<p>
				{ __(
					'Display Thank with Google on these post types',
					'google-site-kit'
				) }
			</p>
			<div className="googlesitekit-twg-post-type-select__options">
				<Chip
					id="all"
					label={ __( 'All', 'google-site-kit' ) }
					onClick={ toggleChip }
					onKeyUp={ toggleChip }
					selected={ ctaPostTypes?.length === postTypes?.length }
				/>
				{ options }
			</div>
		</div>
	);
}
