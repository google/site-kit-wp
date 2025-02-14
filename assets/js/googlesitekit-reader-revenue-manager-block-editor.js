/**
 * Reader Revenue Manager module's block editor entrypoint.
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Fragment, useState } from '@wordpress-core/element';
// eslint-disable-next-line import/no-unresolved
import { SelectControl } from '@wordpress-core/components';
import {
	PluginDocumentSettingPanel,
	// eslint-disable-next-line import/no-unresolved
} from '@wordpress-core/edit-post'; // The @wordpress-core/editor package should ideally be used here, as this component is deprecated in WP 6.6 and upwards. However, since we're supporting WP 5.4+, we should still use the @wordpress-core/edit-post package.
// eslint-disable-next-line import/no-unresolved
import { registerPlugin } from '@wordpress-core/plugins';

/**
 * Internal dependencies
 */
import Data, { dispatch, select, resolveSelect } from 'googlesitekit-data';
import { CORE_MODULES } from './googlesitekit/modules/datastore/constants';
import { MODULES_READER_REVENUE_MANAGER } from './modules/reader-revenue-manager/datastore/constants';
import { registerStore } from './modules/reader-revenue-manager/datastore';
import GoogleLogoIcon from '../svg/graphics/logo-g.svg';

registerStore( Data );

const CORE_EDITOR = 'core/editor';

// TODO: Create components in files under assets/js/modules/reader-revenue-manager/components/block-editor/.
function SettingsForm() {
	const productIDs =
		select( MODULES_READER_REVENUE_MANAGER ).getProductIDs() || [];

	const publicationID = select(
		MODULES_READER_REVENUE_MANAGER
	).getPublicationID();

	const metaKey = `googlesitekit_rrm_${ publicationID }:productID`;

	const metaValue =
		select( CORE_EDITOR ).getEditedPostAttribute( 'meta' )?.[ metaKey ] ||
		'';

	const [ selectedValue, setSelectedValue ] = useState( metaValue );

	const help =
		selectedValue === ''
			? null
			: __(
					'This will override any other settings you might have applied in Site Kit.',
					'google-site-kit'
			  );

	function onChange( value ) {
		setSelectedValue( value );
		dispatch( CORE_EDITOR ).editPost( {
			meta: {
				[ metaKey ]: value,
			},
		} );
	}

	return (
		<Fragment>
			<SelectControl
				className="googlesitekit-rrm-panel__select-control"
				label={ __(
					'Decide how site visitors should access this post (if they will see CTAs by Reader Revenue Manager, which you activated via Site Kit):',
					'google-site-kit'
				) }
				onChange={ onChange }
				value={ selectedValue }
				options={ [
					{
						label: __(
							'Keep the default selection',
							'google-site-kit'
						),
						value: '',
					},
					{
						label: __(
							'Exclude from Reader Revenue Manager',
							'google-site-kit'
						),
						value: 'none',
					},
					{
						label: __( 'Use "open access"', 'google-site-kit' ),
						value: 'openaccess',
					},
					...productIDs.map( ( productID ) => {
						// The product ID will be in the format `publicationID:productID`.
						// We want to display the product ID without the publication ID.
						// See https://github.com/google/site-kit-wp/issues/10228.
						const productIDParts = productID.split( ':' );
						const label =
							productIDParts.length > 1
								? productIDParts[ 1 ]
								: productID;

						return {
							label: sprintf(
								/* translators: %s: Product ID */
								__( 'Use "%s"', 'google-site-kit' ),
								label
							),
							value: productID,
						};
					} ),
				] }
				help={ help }
			/>
		</Fragment>
	);
}

function SiteKitSettingPanel() {
	return (
		<Fragment>
			<PluginDocumentSettingPanel
				name="googlesitekit-rrm-panel"
				title={ __( 'Google Site Kit', 'google-site-kit' ) }
				icon={ <GoogleLogoIcon height="16" width="16" /> }
			>
				<section>
					<h3>
						{ __( 'Reader Revenue Manager', 'google-site-kit' ) }
					</h3>
					<SettingsForm />
				</section>
			</PluginDocumentSettingPanel>
		</Fragment>
	);
}

// Since we aren't currently able to use `useSelect()` in the components, we need to resolve selectors before registering the plugin
// to ensure the data is available when the plugin is rendered.
Promise.all( [
	resolveSelect( CORE_MODULES ).getModules(),
	resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings(),
] ).then( () => {
	const isRRMConnected = select( CORE_MODULES ).isModuleConnected(
		'reader-revenue-manager'
	);

	if ( ! isRRMConnected ) {
		return;
	}

	registerPlugin( 'googlesitekit-rrm-plugin', {
		render: SiteKitSettingPanel,
	} );
} );
