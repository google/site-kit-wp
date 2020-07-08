<?php
/**
 * Class Google\Site_Kit\Modules\Optimize\Settings
 *
 * @package   Google\Site_Kit\Modules\Optimize
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Optimize;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait;

/**
 * Class for Optimize settings.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings {
	use Setting_With_Legacy_Keys_Trait;

	const OPTION = 'googlesitekit_optimize_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.2.0
	 */
	public function register() {
		parent::register();

		$this->register_legacy_keys_migration(
			array(
				'AMPExperimentJson' => 'ampExperimentJSON',
				'ampExperimentJson' => 'ampExperimentJSON',
				'optimize_id'       => 'optimizeID',
				'optimizeId'        => 'optimizeID',
			)
		);

		add_filter(
			'option_' . self::OPTION,
			function ( $option ) {
				// Migrate legacy values where this was saved as decoded JSON object.
				if ( is_array( $option ) && array_key_exists( 'ampExperimentJSON', $option ) && ! is_string( $option['ampExperimentJSON'] ) ) {
					if ( empty( $option['ampExperimentJSON'] ) ) {
						$option['ampExperimentJSON'] = '';
					} else {
						$option['ampExperimentJSON'] = wp_json_encode( $option['ampExperimentJSON'] );
					}
				}

				return $option;
			}
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.2.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ampExperimentJSON' => '',
			'optimizeID'        => '',
		);
	}
}
