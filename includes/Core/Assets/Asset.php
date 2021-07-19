<?php
/**
 * Class Google\Site_Kit\Core\Assets\Asset
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

use Google\Site_Kit\Context;

/**
 * Class representing a single asset.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
abstract class Asset {

	// Various page contexts for Site Kit in the WordPress Admin.
	const CONTEXT_ADMIN_GLOBAL      = 'admin-global';
	const CONTEXT_ADMIN_POST_EDITOR = 'admin-post-editor';
	const CONTEXT_ADMIN_POSTS       = 'admin-posts';
	const CONTEXT_ADMIN_SITEKIT     = 'admin-sitekit';

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
	 * @since 1.37.0 Add the 'load_contexts' argument.
	 *
	 * @param string $handle Unique asset handle.
	 * @param array  $args {
	 *     Associative array of asset arguments.
	 *
	 *     @type string   $src           Required asset source URL.
	 *     @type array    $dependencies  List of asset dependencies. Default empty array.
	 *     @type string   $version       Asset version. Default is the version of Site Kit.
	 *     @type bool     $fallback      Whether to only register as a fallback. Default false.
	 *     @type callable $before_print  Optional callback to execute before printing. Default none.
	 *     @type string[] $load_contexts Optional array of page context values to determine on which page types to load this asset (see the `CONTEXT_` variables above).
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
				'before_print'  => null,
				'load_contexts' => array( self::CONTEXT_ADMIN_SITEKIT ),
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
	 * Checks to see if the specified context exists for the current request.
	 *
	 * @since 1.37.0
	 *
	 * @param string $context Context value (see the `CONTEXT_` variables above).
	 * @return bool TRUE if context exists; FALSE otherwise.
	 */
	public function has_context( $context ) {
		return in_array( $context, $this->args['load_contexts'], true );
	}

	/**
	 * Registers the asset.
	 *
	 * @since 1.0.0
	 * @since 1.15.0 Adds $context parameter.
	 *
	 * @param Context $context Plugin context.
	 */
	abstract public function register( Context $context );

	/**
	 * Enqueues the asset.
	 *
	 * @since 1.0.0
	 */
	abstract public function enqueue();

	/**
	 * Executes the extra callback if defined before printing the asset.
	 *
	 * @since 1.2.0
	 */
	final public function before_print() {
		if ( ! is_callable( $this->args['before_print'] ) ) {
			return;
		}

		call_user_func( $this->args['before_print'], $this->handle );
	}
}
