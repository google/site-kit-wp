/**
 * Snippet Mode Select component.
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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Option, Select } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { SNIPPET_MODES } from '../../constants';

export default function SnippetModeSelect( props ) {
	const {
		isDisabled,
		hasModuleAccess,
		className,
		onChange = () => {},
	} = props;

	const snippetMode = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getSnippetMode()
	);

	const { setSnippetMode } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	const onSnippetModeChange = useCallback(
		( _index, item ) => {
			const newSnippetMode = item.dataset.value;

			setSnippetMode( newSnippetMode );

			onChange( newSnippetMode );
		},
		[ setSnippetMode, onChange ]
	);

	if ( hasModuleAccess === false ) {
		return (
			<Select
				className={ className }
				label={ __( 'Display CTAs', 'google-site-kit' ) }
				value={ snippetMode }
				enhanced
				outlined
				disabled
			>
				<Option value={ snippetMode }>
					{ SNIPPET_MODES[ snippetMode ] }
				</Option>
			</Select>
		);
	}

	return (
		<Select
			className={ className }
			label={ __( 'Display CTAs', 'google-site-kit' ) }
			value={ snippetMode }
			onEnhancedChange={ onSnippetModeChange }
			disabled={ isDisabled }
			enhanced
			outlined
		>
			{ Object.keys( SNIPPET_MODES ).map( ( mode ) => (
				<Option key={ mode } value={ mode }>
					{ SNIPPET_MODES[ mode ] }
				</Option>
			) ) }
		</Select>
	);
}

SnippetModeSelect.propTypes = {
	isDisabled: PropTypes.bool,
	hasModuleAccess: PropTypes.bool,
	className: PropTypes.string,
	onChange: PropTypes.func,
};
