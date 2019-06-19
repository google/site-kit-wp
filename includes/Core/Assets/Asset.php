<?php
/**
 * Class Google\Site_Kit\Core\Assets\Asset
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

/**
 * Class representing a single asset.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
abstract class Asset {

	/**
	 * Unique asset handle.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	protected $handle;

	/**
	 * Asset arguments.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	protected $args = array();

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param string $handle Unique asset handle.
	 * @param array  $args {
	 *     Associative array of asset arguments.
	 *
	 *     @type string   $src             Required asset source URL.
	 *     @type array    $dependencies    List of asset dependencies. Default empty array.
	 *     @type string   $version         Asset version. Default is the version of Site Kit.
	 *     @type bool     $fallback        Whether to only register as a fallback. Default false.
	 *     @type callable $post_register   Optional callback to execute after registration. Default none.
	 *     @type callable $post_enqueue    Optional callback to execute after enqueuing. Default none.
	 * }
	 */
	public function __construct( $handle, array $args ) {
		$this->handle = $handle;
		$this->args   = wp_parse_args(
			$args,
			array(
				'src'           => '',
				'dependencies'  => array(),
				'version'       => GOOGLESITEKIT_VERSION,
				'fallback'      => false,
				'post_register' => null,
				'post_enqueue'  => null,
			)
		);
	}

	/**
	 * Gets the notice handle.
	 *
	 * @since 1.0.0
	 *
	 * @return string Unique notice handle.
	 */
	public function get_handle() {
		return $this->handle;
	}

	/**
	 * Registers the asset.
	 *
	 * @since 1.0.0
	 */
	abstract public function register();

	/**
	 * Enqueues the asset.
	 *
	 * @since 1.0.0
	 */
	abstract public function enqueue();
}
