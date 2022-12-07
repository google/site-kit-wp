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
			$entry = Manifest::get( $this->handle );

			if ( is_array( $entry[0] ) ) {
				// If the first entry item is an array, we can assume `$entry` is an array of entries in the format filename => hash.
				// In this scenario we want to match the nested entry against the filename provided in `$src`.
				$src_filename = basename( $src );

				foreach ( $entry as $entry_pair ) {
					if ( $this->is_matching_manifest_entry( $entry_pair, $src_filename ) ) {
						list( $filename, $hash ) = $entry_pair;
						break;
					}
				}
			} else {
				// Otherwise, `$entry` will be a single entry in the format filename => hash.
				list( $filename, $hash ) = $entry;
			}

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
	 * Checks if the provided manifest entry matches the given filename.
	 *
	 * @since 1.89.0
	 *
	 * @param array  $entry Array of filename, hash.
	 * @param string $src_filename   Filename to check.
	 * @return bool
	 */
	private function is_matching_manifest_entry( array $entry, $src_filename ) {
		list ( $filename, $hash ) = $entry;

		if ( ! isset( $hash ) ) {
			// If the hash is not set, it means the hash is embedded in the entry filename.
			// Remove the hash then compare to the src filename.
			$entry_filename_without_hash = preg_replace( '/-[a-f0-9]+\.js$/', '.js', $filename );
			if ( $src_filename === $entry_filename_without_hash ) {
				return true;
			}
		}

		if ( $filename === $src_filename ) {
			return true;
		}

		return false;
	}

	/**
	 * Sets locale data for the script, if it has translations.
	 *
	 * @since 1.21.0
	 */
	private function set_locale_data() {
		$json_translations = load_script_textdomain( $this->handle, 'google-site-kit' );
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
