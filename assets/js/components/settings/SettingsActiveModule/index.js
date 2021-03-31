/**
 * SettingsActiveModule component.
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
import { filter } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../../material-components';
import SettingsOverlay from '../SettingsOverlay';
import SettingsRenderer from '../SettingsRenderer';
import Header from './Header';
import Footer from './Footer';
import ConfirmDisconnect from './ConfirmDisconnect';

export default function SettingsActiveModule( props ) {
	const {
		name,
		slug,
		homepage,
		isEditing,
		isOpen,
		handleAccordion,
		hasSettings,
		canSubmitChanges,
		provides,
		isSaving,
		error,
		autoActivate,
		setupComplete,
	} = props;

	const moduleKey = `${ slug }-module`;
	const isConnected = applyFilters( `googlesitekit.Connected-${ slug }`, setupComplete );

	// Disable other modules during editing
	const modulesBeingEdited = filter( isEditing, ( module ) => module );
	const editActive = 0 < modulesBeingEdited.length;

	const handleConfirmOrCancel = () => {};
	const handleCancel = () => {};
	const handleEdit = () => {};
	const handleDialog = () => {};
	const handleConfirmRemoveModule = () => {};

	return (
		<div
			className={ classnames(
				'googlesitekit-settings-module',
				'googlesitekit-settings-module--active',
				`googlesitekit-settings-module--${ slug }`,
				{ 'googlesitekit-settings-module--error': error && editActive && isEditing[ moduleKey ] }
			) }
		>
			{ editActive && ! isEditing[ moduleKey ] && <SettingsOverlay compress={ ! isOpen } /> }

			<Header
				slug={ slug }
				name={ name }
				isOpen={ isOpen }
				isConnected={ isConnected }
				handleAccordion={ handleAccordion }
			/>

			<div
				id={ `googlesitekit-settings-module__content--${ slug }` }
				className={ classnames( 'googlesitekit-settings-module__content', { 'googlesitekit-settings-module__content--open': isOpen } ) }
				role="tabpanel"
				aria-hidden={ ! isOpen }
				aria-labelledby={ `googlesitekit-settings-module__header--${ slug }` }
			>
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<SettingsRenderer
								slug={ slug }
								isEditing={ isEditing[ moduleKey ] }
								isOpen={ isOpen }
							/>
						</Cell>
					</Row>
				</Grid>

				<Footer
					slug={ slug }
					name={ name }
					homepage={ homepage }
					autoActivate={ autoActivate }
					isSaving={ isSaving === `${ slug }-module` }
					isEditing={ isEditing[ moduleKey ] }
					hasSettings={ hasSettings }
					canSubmitChanges={ canSubmitChanges }
					setupComplete={ setupComplete }
					handleConfirmOrCancel={ handleConfirmOrCancel }
					handleCancel={ handleCancel }
					handleEdit={ handleEdit }
					handleDialog={ handleDialog }
				/>
			</div>

			<ConfirmDisconnect
				slug={ slug }
				name={ name }
				provides={ provides }
				handleDialog={ handleDialog }
				handleConfirmRemoveModule={ handleConfirmRemoveModule }
			/>
		</div>
	);
}

SettingsActiveModule.propTypes = {
	name: PropTypes.string,
	slug: PropTypes.string,
	homepage: PropTypes.string,
	isEditing: PropTypes.object,
	handleDialog: PropTypes.func,
	hasSettings: PropTypes.bool,
	canSubmitChanges: PropTypes.bool,
	required: PropTypes.array,
	active: PropTypes.bool,
	setupComplete: PropTypes.bool,
	onEdit: PropTypes.func,
	onConfirm: PropTypes.func,
	onCancel: PropTypes.func,
};

SettingsActiveModule.defaultProps = {
	name: '',
	slug: '',
	homepage: '',
	isEditing: {},
	handleDialog: null,
	active: false,
	setupComplete: false,
	onEdit: null,
	onConfirm: null,
	onCancel: null,
};
