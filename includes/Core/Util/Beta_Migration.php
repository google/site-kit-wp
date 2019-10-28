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
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class Beta_Migration
 *
 * @package Google\Site_Kit\Core\Util
 */
class Beta_Migration {
	/**
	 * Option name to identify a site which was previously configured without the proxy.
	 */
	const OPTION_IS_PRE_PROXY_INSTALL = 'googlesitekit_pre_proxy_install';

	/**
	 * WP Ajax Dismiss Action.
	 */
	const ACTION_DISMISS = 'googlesitekit_dismiss';

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	protected $options;

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
		$this->oauth_client = new OAuth_Client( $context );
	}

	/**
	 * Registers hooks.
	 */
	public function register() {
		add_filter(
			'googlesitekit_admin_notices',
			function ( $notices ) {
				$notices[] = new Notice(
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

				return $notices;
			}
		);

		add_action(
			'wp_ajax_' . self::ACTION_DISMISS,
			function () {
				check_ajax_referer( self::ACTION_DISMISS );

				$this->options->delete( self::OPTION_IS_PRE_PROXY_INSTALL );

				wp_send_json_success();
			}
		);

		add_action( 'admin_init', array( $this, 'migrate_old_credentials' ) );
	}

	/**
	 * Migrates old GCP credentials if saved in the option.
	 *
	 * GCP credentials are still possible to use (for now), but only via filter
	 * so they should never be present in the option / Credentials anymore.
	 */
	public function migrate_old_credentials() {
		$credentials = ( new Encrypted_Options( $this->options ) )->get( Credentials::OPTION );

		// Credentials can be filtered in so we must also check if there is a saved option present.
		if ( isset( $credentials['oauth2_client_id'] ) && ! strpos( $credentials['oauth2_client_id'], '.apps.sitekit.withgoogle.com' ) ) {
			$this->options->delete( Credentials::OPTION );
			$this->options->set( self::OPTION_IS_PRE_PROXY_INSTALL, 1 );
		}
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
							action: "<?php echo esc_js( self::ACTION_DISMISS ); ?>",
							_wpnonce: "<?php echo esc_js( wp_create_nonce( self::ACTION_DISMISS ) ); ?>"
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
