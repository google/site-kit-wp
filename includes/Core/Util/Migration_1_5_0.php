<?php
/**
 * Class Google\Site_Kit\Core\Util\Migration_1_5_0
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class Migration_1_5_0
 *
 * @since 1.5.0
 * @access private
 * @ignore
 * @property-read string $db_version
 */
class Migration_1_5_0 /* phpcs:ignore PEAR.NamingConventions.ValidClassName.Invalid */ {
	/**
	 * Target DB version.
	 *
	 * @var string
	 */
	protected $db_version = '1.5.0';

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	protected $options;

	/**
	 * Constructor.
	 *
	 * @since 1.5.0
	 *
	 * @param Context $context Plugin context instance.
	 * @param Options $options Optional. Options instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$this->context = $context;
		$this->options = $options ?: new Options( $context );
	}

	/**
	 * Registers hooks.
	 *
	 * @since 1.5.0
	 */
	public function register() {
		add_action( 'admin_init', array( $this, 'migrate' ) );
	}

	/**
	 * Migrates the DB.
	 *
	 * @since 1.5.0
	 */
	public function migrate() {
		$db_version = $this->options->get( 'googlesitekit_db_version' );

		if ( ! $db_version || version_compare( $db_version, $this->db_version, '<' ) ) {
			$this->options->set( 'googlesitekit_db_version', $this->db_version );
		}
	}

	/**
	 * Gets protected properties.
	 *
	 * @since 1.5.0
	 *
	 * @param string $name Property name.
	 *
	 * @return mixed
	 */
	public function __get( $name ) {
		if ( 'db_version' === $name ) {
			return $this->db_version;
		}
		return null;
	}
}
