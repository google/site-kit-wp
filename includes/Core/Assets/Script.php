<?php
/**
 * Class Google\Site_Kit\Core\Assets\Script
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\BC_Functions;

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
	 * @since 1.15.0 Adds $context parameter.
	 *
	 * @param Context $context Plugin context.
	 */
	public function register( Context $context ) {
		if ( $this->args['fallback'] && wp_script_is( $this->handle, 'registered' ) ) {
			return;
		}

		$src     = $this->args['src'];
		$version = $this->args['version'];

		if ( $src ) {
			list( $filename, $hash ) = Manifest::get( $this->handle );

			if ( $filename ) {
				$src     = $context->url( 'dist/assets/js/' . $filename );
				$version = $hash;
			}
		}

		wp_register_script(
			$this->handle,
			$src,
			(array) $this->args['dependencies'],
			$version,
			$this->args['in_footer']
		);

		if ( ! empty( $this->args['execution'] ) ) {
			wp_script_add_data( $this->handle, 'script_execution', $this->args['execution'] );
		}

		if ( ! empty( $src ) ) {
			$this->set_locale_data();
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

	/**
	 * Sets locale data for the script, if it has translations.
	 *
	 * @since 1.21.0
	 */
	private function set_locale_data() {
		$json_translations = BC_Functions::load_script_textdomain( $this->handle, 'google-site-kit' );
		if ( ! $json_translations ) {
			return;
		}

		$output = <<<JS
( function( domain, translations ) {
	try {
		var localeData = translations.locale_data[ domain ] || translations.locale_data.messages;
		localeData[""].domain = domain;
		googlesitekit.i18n.setLocaleData( localeData, domain );
	} catch {
	}
} )( "google-site-kit", {$json_translations} );
JS;

		wp_add_inline_script( $this->handle, $output, 'before' );
	}

}
