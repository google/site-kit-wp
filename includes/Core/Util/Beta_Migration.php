<?php
/**
 * Beta_Migration
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Notice;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class Beta_Migration
 *
 * @package Google\Site_Kit\Core\Util
 */
class Beta_Migration {
	/**
	 * Target database version.
	 */
	const DB_VERSION = '1.0.0';

	/**
	 * Option name to identify a site which was previously configured without the proxy.
	 */
	const OPTION_IS_PRE_PROXY_INSTALL = 'googlesitekit_pre_proxy_install';

	/**
	 * Query parameter for identifying a pre-proxy action.
	 */
	const PARAM_PRE_PROXY_ACTION = 'googlesitekit_pre_proxy_action';

	/**
	 * WP Nonce Action.
	 */
	const ACTION = 'dismiss_reconnect_notice';

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	protected $options;

	/**
	 * Credentials instance.
	 *
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * OAuth Client instance.
	 *
	 * @var OAuth_Client
	 */
	protected $oauth_client;

	/**
	 * Beta_Migration constructor.
	 *
	 * @param Context $context Plugin context instance.
	 */
	public function __construct( Context $context ) {
		$this->options      = new Options( $context );
		$this->credentials  = new Credentials( $this->options );
		$this->oauth_client = new OAuth_Client( $context );
	}

	/**
	 * Registers hooks.
	 */
	public function register() {
		$notice = new Notice(
			'beta-migration',
			array(
				'content'         => function () {
					return $this->get_notice_content();
				},
				'active_callback' => function () {
					return $this->options->get( self::OPTION_IS_PRE_PROXY_INSTALL ) && current_user_can( Permissions::SETUP );
				},
			)
		);

		add_action(
			'wp_ajax_googlesitekit_' . self::ACTION,
			function () {
				check_ajax_referer( self::ACTION );

				$this->options->delete( self::OPTION_IS_PRE_PROXY_INSTALL );

				wp_send_json_success();
			}
		);

		add_action( 'admin_init', array( $this, 'handle_action' ) );
		add_action( 'admin_init', array( $this, 'maybe_run_upgrade' ) );
		add_action( 'admin_notices', array( $notice, 'render' ) );
		add_action( 'network_admin_notices', array( $notice, 'render' ) );
	}

	/**
	 * Runs the upgrade based on the current DB version.
	 */
	public function maybe_run_upgrade() {
		if ( version_compare( get_option( 'googlesitekit_db_version', '0' ), self::DB_VERSION, '<' ) ) {
			$this->run_upgrade();
		}
	}

	/**
	 * Runs the upgrade.
	 */
	private function run_upgrade() {
		$credentials = $this->credentials->get();

		if ( ! strpos( $credentials['oauth2_client_id'], '.apps.sitekit.withgoogle.com' ) ) {
			$this->options->delete( Credentials::OPTION );
			$this->options->set( self::OPTION_IS_PRE_PROXY_INSTALL, 1 );
		}

		update_option( 'googlesitekit_db_version', self::DB_VERSION );
	}

	/**
	 * Gets the content to render in the reconnect notice.
	 *
	 * Mirrors behavior of core's dismissible notices, while dismissing DB flag asynchronously.
	 *
	 * @link https://github.com/WordPress/WordPress/blob/956725990f075cb6b8b5a0b8a480c4c823a3fd99/wp-admin/js/common.js#L765-L770
	 *
	 * @return string
	 */
	private function get_notice_content() {
		ob_start();
		?>
		<p>
			<?php esc_html_e( 'We’ve made a lot of improvements to get Site Kit ready for general release! In order to use this new version, you’ll need to go through the updated setup flow to re-generate your credentials. Once you’re done, all your data will still be there.', 'google-site-kit' ); ?>
		</p>
		<p style="display: flex; align-items: center;">
			<a href="<?php echo esc_url( $this->oauth_client->get_proxy_setup_url() ); ?>" class="button button-primary button-large">
				<?php esc_html_e( 'Reconnect Site Kit', 'google-site-kit' ); ?>
			</a>
			<span style="width: 1rem;"> </span>
			<a href="#" data-dismiss>
				<?php echo esc_html_x( 'Ignore', 'ignore/dismiss the notice', 'google-site-kit' ); ?>
			</a>
		</p>
		<?php /* Add JS for dismissing the flag in the DB when either link is clicked in the background. */ ?>
		<script>
			jQuery( function ( $ ) {
				var $notice = $( '#googlesitekit-notice-beta-migration' );
				$notice
					.on( 'click', 'a', function () {
						$.post( ajaxurl, {
							action: "<?php echo esc_js( 'googlesitekit_' . self::ACTION ); ?>",
							_wpnonce: "<?php echo esc_js( wp_create_nonce( self::ACTION ) ); ?>"
						} );
					} )
					.on( 'click', '[data-dismiss]', function( event ) {
						event.preventDefault();
						$notice.fadeTo( 100, 0, function() {
							$notice.slideUp( 100, function() {
								$notice.remove();
							} );
						} );
					} );
			} )
		</script>
		<?php

		return ob_get_clean();
	}
}
