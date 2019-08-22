/**
 * External dependencies
 */
import SvgIcon from 'GoogleUtil/svg-icon';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class AdSenseSettingsWarning extends Component {
	render() {
		const {
			slug,
			context,
			OriginalComponent,
		} = this.props;

		if ( 'adsense' !== slug ) {
			return <OriginalComponent { ...this.props } />;
		}

		const { active, setupComplete } = googlesitekit.modules.adsense;
		let message = __( 'Ad blocker detected, you need to disable it in order to setup AdSense.', 'google-site-kit' );
		if ( active && setupComplete ) {
			message = __( 'Ad blocker detected, You need to disable it to get the AdSense latest data.', 'google-site-kit' );
		}

		if ( ! googlesitekit.canAdsRun ) {
			return (
				<div className={ `googlesitekit-settings-module-warning googlesitekit-settings-module-warning--${ context }` }>
					<SvgIcon id="error" height="20" width="23" /> { message }
				</div>
			);
		}

		return <OriginalComponent { ...this.props } />;
	}
}

export default AdSenseSettingsWarning;
