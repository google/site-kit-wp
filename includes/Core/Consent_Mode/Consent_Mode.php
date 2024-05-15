<?php
/**
 * Class Google\Site_Kit\Core\Consent_Mode\Consent_Mode
 *
 * @package   Google\Site_Kit\Core\Consent_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Consent_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for handling Consent Mode.
 *
 * @since 1.122.0
 * @access private
 * @ignore
 */
class Consent_Mode {
	use Method_Proxy_Trait;

	/**
	 * Consent_Mode_Settings instance.
	 *
	 * @since 1.122.0
	 * @var Consent_Mode_Settings
	 */
	protected $consent_mode_settings;

	/**
	 * REST_Consent_Mode_Controller instance.
	 *
	 * @since 1.122.0
	 * @var REST_Consent_Mode_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.122.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$options                     = $options ?: new Options( $context );
		$this->consent_mode_settings = new Consent_Mode_Settings( $options );
		$this->rest_controller       = new REST_Consent_Mode_Controller( $this->consent_mode_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.122.0
	 */
	public function register() {
		$this->consent_mode_settings->register();
		$this->rest_controller->register();

		// Declare that the plugin is compatible with the WP Consent API.
		$plugin = GOOGLESITEKIT_PLUGIN_BASENAME;
		add_filter( "wp_consent_api_registered_{$plugin}", '__return_true' );

		$consent_mode_enabled = $this->consent_mode_settings->is_consent_mode_enabled();

		if ( $consent_mode_enabled ) {
			// The `wp_head` action is used to ensure the snippets are printed in the head on the front-end only, not admin pages.
			add_action(
				'wp_head',
				$this->get_method_proxy( 'render_gtag_consent_snippet' ),
				1 // Set priority to 1 to ensure the snippet is printed with top priority in the head.
			);
		}

		add_filter(
			'googlesitekit_consent_mode_status',
			function () use ( $consent_mode_enabled ) {
				return $consent_mode_enabled ? 'enabled' : 'disabled';
			}
		);
	}

	/**
	 * Prints the gtag consent snippet.
	 *
	 * @since 1.122.0
	 */
	protected function render_gtag_consent_snippet() {
		/**
		 * Filters the consent mode defaults.
		 *
		 * Allows these defaults to be modified, thus allowing users complete control over the consent mode parameters.
		 *
		 * @since 1.126.0
		 *
		 * @param array $consent_mode_defaults Default values for consent mode.
		 */
		$consent_defaults = apply_filters(
			'googlesitekit_consent_defaults',
			array(
				'ad_personalization' => 'denied',
				'ad_storage'         => 'denied',
				'ad_user_data'       => 'denied',
				'analytics_storage'  => 'denied',
				// TODO: The value for `region` should be retrieved from $this->consent_mode_settings->get_regions(),
				// but we'll need to migrate/clean up the incorrect values that were set from the initial release.
				// See https://github.com/google/site-kit-wp/issues/8444.
				'region'             => Regions::EU_USER_CONSENT_POLICY,
				'wait_for_update'    => 500, // Allow 500ms for Consent Management Platforms (CMPs) to update the consent status.
			)
		);

		/**
		 * Filters the consent category mapping.
		 *
		 * @since 1.124.0
		 *
		 * @param array $consent_category_map Default consent category mapping.
		 */
		$consent_category_map = apply_filters(
			'googlesitekit_consent_category_map',
			array(
				'statistics' => array( 'analytics_storage' ),
				'marketing'  => array( 'ad_storage', 'ad_user_data', 'ad_personalization' ),
			)
		);
		// TODO: We may want to extract some of this JS so it can be transpiled and rewrite it using modern language features.
		?>
<!-- <?php echo esc_html__( 'Google tag (gtag.js) Consent Mode snippet added by Site Kit', 'google-site-kit' ); ?> -->
<script id='google_gtagjs-js-consent-mode'>
window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', <?php echo wp_json_encode( $consent_defaults ); ?>);
window._googlesitekitConsentCategoryMap = <?php	echo wp_json_encode( $consent_category_map ); ?>;
( function () {
	document.addEventListener(
		'wp_listen_for_consent_change',
		function ( event ) {
			if ( event.detail ) {
				var consentParameters = {};
				var hasConsentParameters = false;
				for ( var category in event.detail ) {
					if ( window._googlesitekitConsentCategoryMap[ category ] ) {
						var status = event.detail[ category ];
						var mappedStatus =
							status === 'allow' ? 'granted' : 'denied';
						var parameters =
							window._googlesitekitConsentCategoryMap[ category ];
						for ( var i = 0; i < parameters.length; i++ ) {
							consentParameters[ parameters[ i ] ] = mappedStatus;
						}
						hasConsentParameters = !! parameters.length;
					}
				}
				if ( hasConsentParameters ) {
					gtag( 'consent', 'update', consentParameters );
				}
			}
		}
	);

	function updateGrantedConsent() {
		if ( ! ( window.wp_consent_type || window.wp_fallback_consent_type ) ) {
			return;
		}
		var consentParameters = {};
		var hasConsentParameters = false;
		for ( var category in window._googlesitekitConsentCategoryMap ) {
			if ( window.wp_has_consent && window.wp_has_consent( category ) ) {
				var parameters =
					window._googlesitekitConsentCategoryMap[ category ];
				for ( var i = 0; i < parameters.length; i++ ) {
					consentParameters[ parameters[ i ] ] = 'granted';
				}
				hasConsentParameters =
					hasConsentParameters || !! parameters.length;
			}
		}
		if ( hasConsentParameters ) {
			gtag( 'consent', 'update', consentParameters );
		}
	}
	document.addEventListener(
		'wp_consent_type_defined',
		updateGrantedConsent
	);
	document.addEventListener( 'DOMContentLoaded', function () {
		if ( ! window.waitfor_consent_hook ) {
			updateGrantedConsent();
		}
	} );
} )();
</script>
<!-- <?php echo esc_html__( 'End Google tag (gtag.js) Consent Mode snippet added by Site Kit', 'google-site-kit' ); ?> -->
			<?php
	}
}
