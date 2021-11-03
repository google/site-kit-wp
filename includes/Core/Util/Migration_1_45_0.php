<?php
/**
 * Migration for 1.45.0
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification_File;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_User;
use WP_Error;

/**
 * Class Migration_1_45_0
 *
 * @since 1.45.0
 * @access private
 * @ignore
 */
class Migration_1_45_0 {
	/**
	 * Target DB version.
	 */
	const DB_VERSION = '1.45.0';

	const OPTION_KEY_PSI_UPDATED = 'googlesitekit_psi_updated';

	/**
	 * Context instance.
	 *
	 * @since 1.45.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since 1.45.0
	 * @var Options
	 */
	protected $options;

	/**
	 * User_Options instance.
	 *
	 * @since 1.45.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.45.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Constructor.
	 *
	 * @since 1.45.0
	 *
	 * @param Context        $context        Plugin context instance.
	 * @param Options        $options        Optional. Options instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		Authentication $authentication = null
	) {
		$this->context        = $context;
		$this->options        = $options ?: new Options( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
	}

	/**
	 * Registers hooks.
	 *
	 * @since 1.45.0
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.45.0
	 */
	public function migrate() {
		$db_version = $this->options->get( 'googlesitekit_db_version' );

		// Do not run if database version already updated.
		if ( $db_version && version_compare( $db_version, self::DB_VERSION, '>=' ) ) {
			return;
		}

		if ( $this->authentication->is_setup_completed() ) {
			$this->options->set( self::OPTION_KEY_PSI_UPDATED, true );
		}

		// Update database version.
		$this->options->set( 'googlesitekit_db_version', self::DB_VERSION );
	}
}
