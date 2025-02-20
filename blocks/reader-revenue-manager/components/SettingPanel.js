// modules/reader-revenue-manager/components/SiteKitSettingPanel.js
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
// eslint-disable-next-line import/no-unresolved
import { PluginDocumentSettingPanel } from '@wordpress-core/edit-post';
import GoogleLogoIcon from '../../../assets/svg/graphics/logo-g.svg';
import SettingsForm from './SettingsForm';

export default function SettingPanel() {
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
