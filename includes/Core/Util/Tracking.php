<?php
/**
 * Class Google\Site_Kit\Core\Util\Tracking
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;

/**
 * Class managing admin tracking.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Tracking {

	/**
	 * Tracking Optin Key
	 *
	 * @var string tracking optin key for options table.
	 */
	const TRACKING_OPTIN_KEY = 'googlesitekit_tracking_optin';

	const TRACKING_ID = 'UA-130569087-3';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Authentication instance.
	 *
	 * @since 1.0.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context        $context        Plugin context.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 */
	public function __construct( Context $context, Authentication $authentication = null ) {
		$this->context = $context;

		if ( ! $authentication ) {
			$authentication = new Authentication( $this->context );
		}
		$this->authentication = $authentication;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		// Enqueue gtag script for Site Kit admin screens.
		add_action(
			'googlesitekit_enqueue_screen_assets',
			function () {
				$this->print_gtag_script();
			}
		);

		// Enqueue gtag script for additional areas.
		add_action(
			'admin_enqueue_scripts',
			function () {
				$current_screen = get_current_screen();
				if ( ! in_array( $current_screen->id, array( 'dashboard', 'plugins' ), true ) ) {
					return;
				}
				$this->print_gtag_script();
				if ( ! $this->authentication->is_authenticated() ) {
					$this->print_standalone_event_tracking_script();
				}
			}
		);

		add_filter(
			'googlesitekit_admin_data',
			function ( $data ) {
				return $this->inline_js_admin_data( $data );
			}
		);

		add_action(
			'init',
			function () {
				$this->register_settings();
			}
		);
	}

	/**
	 * Is tracking active for this plugin install?
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if tracking enabled, and False if not.
	 */
	public function is_active() {
		return (bool) get_option( self::TRACKING_OPTIN_KEY, false );
	}

	/**
	 * Output Tag Manager gtag.js if tracking is enabled.
	 *
	 * @since 1.0.0
	 */
	private function print_gtag_script() {
		// Only load if tracking is active.
		$tracking_active = $this->is_active();

		if ( ! $tracking_active ) {
			return;
		}
		?>
		<!-- Global site tag (gtag.js) - Google Analytics -->
		<script async src="<?php echo esc_url( 'https://www.googletagmanager.com/gtag/js?id=' . self::TRACKING_ID ); ?>"></script><?php // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript ?>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', '<?php echo esc_attr( self::TRACKING_ID ); ?>');
			window.googlesitekitTrackingEnabled = true;
		</script>
		<?php
	}

	/**
	 * Prints standalone tracking event function.
	 *
	 * This is used for when not on a screen owned by Site Kit.
	 *
	 * @since 1.0.0
	 */
	private function print_standalone_event_tracking_script() {
		?>
		<script type="text/javascript">
		var sendAnalyticsTrackingEvent = function( eventCategory, eventName, eventLabel, eventValue ) {
			if ( 'undefined' === typeof gtag ) {
				return;
			}

			if ( window.googlesitekitTrackingEnabled ) {
				gtag( 'event', eventName, {
					send_to: '<?php echo esc_attr( self::TRACKING_ID ); ?>', /*eslint camelcase: 0*/
					event_category: eventCategory, /*eslint camelcase: 0*/
				} );
			}
		};
		</script>
		<?php
	}

	/**
	 * Modifies the admin data to pass to JS.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_admin_data( $data ) {
		$data['trackingID'] = self::TRACKING_ID;

		return $data;
	}

	/**
	 * Register tracking settings and allow access from Rest API.
	 *
	 * @since 1.0.0
	 */
	private function register_settings() {
		$args = array(
			'type'         => 'boolean',
			'description'  => __( 'Allowing tracking of anonymous usage stats.', 'google-site-kit' ),
			'default'      => false,
			'show_in_rest' => true,
		);
		register_setting( 'google-site-kit', self::TRACKING_OPTIN_KEY, $args );
	}
}
