/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	activateOrDeactivateModule,
	getReAuthURL,
	showErrorNotification,
} from '../../../util';
import CTA from '../../../components/notifications/cta';
import data from '../../../components/data';
import GenericError from '../../../components/notifications/generic-error';
import { STORE_NAME as MODULES_STORE } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME as USER_STORE } from '../../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

function DashboardPageSpeedCTA() {
	const { active, setupComplete } = useSelect( ( select ) => select( MODULES_STORE ).getModule( 'pagespeed-insights' ) );
	const canManageOptions = useSelect( ( select ) => select( USER_STORE ).hasCapability( 'canManageOptions' ) );

	if ( ! canManageOptions && ! setupComplete ) {
		return null;
	}

	const handleSetUpClick = async () => {
		try {
			await activateOrDeactivateModule( data, 'pagespeed-insights', true );
			global.location = getReAuthURL( 'pagespeed-insights' );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'pagespeed-insights-setup-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
		}
	};

	return (
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-12
		">
			<CTA
				title={ ! setupComplete && active
					? __( 'Complete PageSpeed Insights activation.', 'google-site-kit' )
					: __( 'Activate PageSpeed Insights.', 'google-site-kit' )
				}
				description={ __( 'Google PageSpeed Insights gives you metrics about performance, accessibility, SEO and PWA.', 'google-site-kit' ) }
				ctaLink={ '#' }
				ctaLabel={ ! setupComplete && active
					? __( 'Complete activation', 'google-site-kit' )
					: __( 'Activate PageSpeed Insights', 'google-site-kit' )
				}
				onClick={ handleSetUpClick }
			/>
		</div>
	);
}

export default DashboardPageSpeedCTA;
