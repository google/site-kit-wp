/**
 * External dependencies
 */
import CTA from 'GoogleComponents/notifications/cta';
import data from 'GoogleComponents/data';
import GenericError from 'GoogleComponents/notifications/generic-error';
import {
	activateOrDeactivateModule,
	getReAuthURL,
	showErrorNotification,
} from 'GoogleUtil';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const PageSpeedInsightsCTA = () => {
	const {
		active,
		setupComplete,
	} = global.googlesitekit.modules[ 'pagespeed-insights' ];

	const { canManageOptions } = global.googlesitekit.permissions;

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
};

export default PageSpeedInsightsCTA;
