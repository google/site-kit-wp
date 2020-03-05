<?php
/**
 * Class Google\Site_Kit\Core\Assets\Script
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

/**
 * Class representing a single script.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
class Script extends Asset {

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param string $handle Unique script handle.
	 * @param array  $args {
	 *     Associative array of script arguments.
	 *
	 *     @type string   $src          Required script source URL.
	 *     @type array    $dependencies List of script dependencies. Default empty array.
	 *     @type string   $version      Script version. Default is the version of Site Kit.
	 *     @type bool     $fallback     Whether to only register as a fallback. Default false.
	 *     @type callable $before_print Optional callback to execute before printing. Default none.
	 *     @type bool     $in_footer    Whether to load script in footer. Default true.
	 *     @type string   $execution    How to handle script execution, e.g. 'defer'. Default empty string.
	 * }
	 */
	public function __construct( $handle, array $args ) {
		parent::__construct( $handle, $args );

		$this->args = wp_parse_args(
			$this->args,
			array(
				'in_footer' => true,
				'execution' => '',
			)
		);
	}

	/**
	 * Registers the script.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		if ( $this->args['fallback'] && wp_script_is( $this->handle, 'registered' ) ) {
			return;
		}

		wp_register_script(
			$this->handle,
			$this->args['src'],
			(array) $this->args['dependencies'],
			$this->args['version'],
			$this->args['in_footer']
		);

		if ( ! empty( $this->args['execution'] ) ) {
			wp_script_add_data( $this->handle, 'script_execution', $this->args['execution'] );
		}
	}

	/**
	 * Enqueues the script.
	 *
	 * @since 1.0.0
	 */
	public function enqueue() {
		wp_enqueue_script( $this->handle );
	}
}
