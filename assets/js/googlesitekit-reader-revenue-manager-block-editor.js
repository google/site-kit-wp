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
import { __ } from '@wordpress/i18n';
import { Fragment, useState } from '@wordpress-core/element';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
} from '@wordpress-core/components';
import {
	PluginDocumentSettingPanel,
	PluginSidebarMoreMenuItem,
	PluginSidebar,
} from '@wordpress-core/editor';
import { registerPlugin } from '@wordpress-core/plugins';

/**
 * Internal dependencies
 */
import { select } from 'googlesitekit-data';
import { CORE_MODULES } from './googlesitekit/modules/datastore/constants';
import GoogleLogoIcon from '../svg/graphics/logo-g.svg';

function SettingsForm() {
	const [ useSnippet, setUseSnippet ] = useState( false );

	return (
		<Fragment>
			<ToggleControl
				label="Place snippet"
				checked={ useSnippet }
				onChange={ ( value ) => setUseSnippet( value ) }
			/>
			{ useSnippet && (
				<Fragment>
					<br />
					<SelectControl
						label={ __( 'Product ID', 'google-site-kit' ) }
						options={ [
							{
								label: __( 'Inherit', 'google-site-kit' ),
								value: '',
							},
							{
								label: __( 'Open access', 'google-site-kit' ),
								value: 'openaccess',
							},
							{
								label: __( 'Product ID A', 'google-site-kit' ),
								value: 'openaccess',
							},
							{
								label: __( 'Product ID B', 'google-site-kit' ),
								value: 'openaccess',
							},
						] }
						help={ __(
							'The snippet configuration will be inherited from a parent taxonomy term, or Site Kit settings.',
							'google-site-kit'
						) }
					/>
				</Fragment>
			) }
		</Fragment>
	);
}

function PanelSection( { children, title } ) {
	return (
		<section>
			<h3>{ title }</h3>
			{ children }
		</section>
	);
}

function SiteKitSettingPanel() {
	const isRRMConnected = select( CORE_MODULES ).isModuleConnected(
		'reader-revenue-manager'
	);

	if ( ! isRRMConnected ) {
		return null;
	}

	const isDocumentSettingPanelAvailable =
		typeof wp.editPost?.PluginDocumentSettingPanel === 'function';

	return (
		<Fragment>
			<PluginSidebarMoreMenuItem
				target="google-site-kit"
				icon={ <GoogleLogoIcon height="16" width="16" /> }
			>
				{ __( 'Google Site Kit', 'google-site-kit' ) }
			</PluginSidebarMoreMenuItem>
			<PluginSidebar
				name="google-site-kit"
				title={ __( 'Google Site Kit', 'google-site-kit' ) }
				icon={ <GoogleLogoIcon height="16" width="16" /> }
			>
				<PanelBody
					title={ __( 'Reader Revenue Manager', 'google-site-kit' ) }
				>
					<SettingsForm />
				</PanelBody>
			</PluginSidebar>
			{ isDocumentSettingPanelAvailable && (
				<PluginDocumentSettingPanel
					name="google-site-kit"
					title={ __( 'Google Site Kit', 'google-site-kit' ) }
					icon={ <GoogleLogoIcon height="16" width="16" /> }
				>
					<PanelSection
						title={ __(
							'Reader Revenue Manager',
							'google-site-kit'
						) }
					>
						<SettingsForm />
					</PanelSection>
				</PluginDocumentSettingPanel>
			) }
		</Fragment>
	);
}

registerPlugin( 'google-site-kit', {
	render: SiteKitSettingPanel,
	icon: <GoogleLogoIcon height="16" width="16" />,
} );
