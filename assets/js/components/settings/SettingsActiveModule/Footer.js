/**
 * Footer component for SettingsActiveModule.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useHistory, useParams } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { Cell, Grid, Row } from '../../../material-components';
import { trackEvent } from '../../../util';
import { clearCache } from '../../../googlesitekit/api/cache';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import useViewContext from '../../../hooks/useViewContext';
import FooterPrimaryAction from './FooterPrimaryAction';
import FooterSecondaryAction from './FooterSecondaryAction';

export default function Footer( { slug } ) {
	const viewContext = useViewContext();
	const history = useHistory();
	const { action, moduleSlug } = useParams();
	const isEditing = action === 'edit' && moduleSlug === slug;

	const errorKey = `module-${ slug }-error`;
	const dialogActiveKey = `module-${ slug }-dialogActive`;
	const isSavingKey = `module-${ slug }-isSaving`;

	const dialogActive = useSelect( ( select ) =>
		select( CORE_UI ).getValue( dialogActiveKey )
	);
	const isSaving = useSelect( ( select ) =>
		select( CORE_UI ).getValue( isSavingKey )
	);
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( slug )
	);

	const { submitChanges } = useDispatch( CORE_MODULES );
	const { clearErrors } = useDispatch( module?.storeName ) || {};
	const { setValue } = useDispatch( CORE_UI );

	const handleClose = useCallback( async () => {
		await trackEvent(
			`${ viewContext }_module-list`,
			'cancel_module_settings',
			slug
		);
		await clearErrors?.();
		history.push( `/connected-services/${ slug }` );
	}, [ clearErrors, history, viewContext, slug ] );

	const handleConfirm = useCallback(
		async ( event ) => {
			event.preventDefault();

			setValue( isSavingKey, true );
			const { error: submissionError } = await submitChanges( slug );
			setValue( isSavingKey, false );

			if ( submissionError ) {
				setValue( errorKey, submissionError );
			} else {
				await trackEvent(
					`${ viewContext }_module-list`,
					'update_module_settings',
					slug
				);
				setValue( errorKey, undefined );
				await clearErrors?.();
				history.push( `/connected-services/${ slug }` );
				await clearCache();
			}
		},
		[
			setValue,
			isSavingKey,
			submitChanges,
			slug,
			errorKey,
			clearErrors,
			history,
			viewContext,
		]
	);

	const handleDialog = useCallback( () => {
		setValue( dialogActiveKey, ! dialogActive );
	}, [ dialogActive, dialogActiveKey, setValue ] );

	const handleEdit = useCallback( () => {
		trackEvent(
			`${ viewContext }_module-list`,
			'edit_module_settings',
			slug
		);
	}, [ slug, viewContext ] );

	if ( ! module ) {
		return null;
	}

	return (
		<footer className="googlesitekit-settings-module__footer">
			<Grid>
				<Row>
					<Cell lgSize={ 6 } mdSize={ 8 } smSize={ 4 }>
						<FooterPrimaryAction
							slug={ slug }
							isEditing={ isEditing }
							isSaving={ isSaving }
							handleConfirm={ handleConfirm }
							handleClose={ handleClose }
							handleEdit={ handleEdit }
						/>
					</Cell>
					<Cell
						lgSize={ 6 }
						mdSize={ 8 }
						smSize={ 4 }
						alignMiddle
						lgAlignRight
					>
						<FooterSecondaryAction
							slug={ slug }
							isEditing={ isEditing }
							handleDialog={ handleDialog }
						/>
					</Cell>
				</Row>
			</Grid>
		</footer>
	);
}

Footer.propTypes = {
	slug: PropTypes.string.isRequired,
};
