/**
 * Post Types Select component.
 *
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import {
	ChipMultiSelect,
	ChipMultiSelectItem,
} from '../../../../components/ChipMultiSelect';

export default function PostTypesSelect( props ) {
	const { isDisabled, hasModuleAccess, onChange = () => {} } = props;

	const allPostTypes = useSelect( ( select ) =>
		select( CORE_SITE ).getPostTypes()
	);

	const postTypes = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPostTypes()
	);

	const { setPostTypes } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const onPostTypesChange = useCallback(
		( slug ) => {
			const newPostTypes = postTypes.includes( slug )
				? postTypes.filter( ( id ) => id !== slug )
				: [ ...postTypes, slug ];

			setPostTypes( newPostTypes );

			onChange( newPostTypes );
		},
		[ onChange, postTypes, setPostTypes ]
	);

	return (
		<ChipMultiSelect onToggleChip={ onPostTypesChange }>
			{ allPostTypes.map( ( { slug, label } ) => (
				<ChipMultiSelectItem
					key={ slug }
					id={ slug }
					selected={ postTypes.includes( slug ) }
					disabled={ isDisabled || ! hasModuleAccess }
				>
					{ label }
				</ChipMultiSelectItem>
			) ) }
		</ChipMultiSelect>
	);
}

PostTypesSelect.propTypes = {
	isDisabled: PropTypes.bool,
	hasModuleAccess: PropTypes.bool,
	onChange: PropTypes.func,
};
