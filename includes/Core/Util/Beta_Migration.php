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
	 * Handles the pre-proxy action chosen by the user.
	 */
	public function handle_action() {
		$action = filter_input( INPUT_GET, self::PARAM_PRE_PROXY_ACTION );

		if ( ! $action ) {
			return;
		}

		if ( ! check_admin_referer( self::ACTION ) || ! in_array( $action, array( 'reconnect', 'ignore' ), true ) ) {
			return;
		}

		$this->options->delete( self::OPTION_IS_PRE_PROXY_INSTALL );

		if ( 'reconnect' === $action ) {
			wp_safe_redirect( $this->oauth_client->get_proxy_setup_url() );
		} elseif ( 'ignore' === $action ) {
			// Redirect to the current URL without the action params.
			wp_safe_redirect(
				add_query_arg(
					array(
						self::PARAM_PRE_PROXY_ACTION => false,
						'_wpnonce'                   => false,
					)
				)
			);
		}

		exit;
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
	 * @return string
	 */
	private function get_notice_content() {
		ob_start();
		?>
		<p>
			<?php esc_html_e( 'We’ve made a lot of improvements to get Site Kit ready for general release! In order to use this new version, you’ll need to go through the updated setup flow to re-generate your credentials. Once you’re done, all your data will still be there.', 'google-site-kit' ); ?>
		</p>
		<p style="display: flex; align-items: center;">
			<a href="<?php echo esc_url( $this->get_action_url( 'reconnect' ) ); ?>" class="button button-primary button-large">
				<?php esc_html_e( 'Reconnect Site Kit', 'google-site-kit' ); ?>
			</a>
			<span style="width: 1rem;"></span>
			<a href="<?php echo esc_url( $this->get_action_url( 'ignore' ) ); ?>">
				<?php echo esc_html_x( 'Ignore', 'ignore/dismiss the notice', 'google-site-kit' ); ?>
			</a>
		</p>
		<?php

		return ob_get_clean();
	}

	/**
	 * Gets the URL for performing the given action.
	 *
	 * @param string $action Action to perform.
	 *
	 * @return string
	 */
	private function get_action_url( $action ) {
		return add_query_arg(
			array(
				self::PARAM_PRE_PROXY_ACTION => $action,
				'_wpnonce'                   => wp_create_nonce( self::ACTION ),
			)
		);
	}
}
