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

use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Util\Migrate_Legacy_Keys;

/**
 * Class for Optimize settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Setting {
	use Migrate_Legacy_Keys;

	const OPTION = 'googlesitekit_optimize_settings';

	/**
	 * Mapping of legacy keys to current key.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $legacy_key_map = array(
		'AMPExperimentJson' => 'ampExperimentJSON',
		'ampExperimentJson' => 'ampExperimentJSON',
		'optimize_id'       => 'optimizeID',
		'optimizeId'        => 'optimizeID',
	);

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		register_setting(
			self::OPTION,
			self::OPTION,
			array(
				'type'              => 'object',
				'sanitize_callback' => $this->get_sanitize_callback(),
				'default'           => $this->get_default(),
			)
		);

		add_filter(
			'option_' . self::OPTION,
			function ( $option ) {
				if ( ! is_array( $option ) ) {
					$option = $this->get_default();
				} else {
					$option = $this->migrate_legacy_keys( $option, $this->legacy_key_map );
				}

				// Fill in any missing keys with defaults.
				return $option + $this->get_default();
			}
		);
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_default() {
		return array(
			'ampExperimentJSON' => '',
			'optimizeID'        => '',
		);
	}
}
