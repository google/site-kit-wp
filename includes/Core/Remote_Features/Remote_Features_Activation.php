<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features_Activation
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class handling the application of remote feature activation.
 *
 * @since 1.133.0
 * @access private
 * @ignore
 */
class Remote_Features_Activation {
	use Method_Proxy_Trait;

	/**
	 * Remote_Features instance.
	 *
	 * @var Remote_Features
	 */
	private $remote_features;

	/**
	 * Loaded features.
	 *
	 * @var array
	 */
	private $features;

	/**
	 * Constructor.
	 *
	 * @param Remote_Features $remote_features Remote_Features instance.
	 */
	public function __construct( Remote_Features $remote_features ) {
		$this->remote_features = $remote_features;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.133.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_is_feature_enabled',
			$this->get_method_proxy( 'enable_features' ),
			10,
			2
		);
	}

	/**
	 * Gets the current set of remote features.
	 *
	 * @return array|mixed
	 */
	private function get_features() {
		if ( null === $this->features ) {
			$this->features = $this->remote_features->get();
		}

		return $this->features;
	}

	/**
	 * Filters feature flags using features stored in options.
	 *
	 * @since 1.133.0
	 *
	 * @param boolean $feature_enabled Original value of the feature.
	 * @param string  $feature_name    Feature name.
	 * @return boolean State flag from options if it is available, otherwise the original value.
	 */
	private function enable_features( $feature_enabled, $feature_name ) {
		$features = $this->get_features();

		if ( isset( $features[ $feature_name ]['enabled'] ) ) {
			return filter_var( $features[ $feature_name ]['enabled'], FILTER_VALIDATE_BOOLEAN );
		}

		return $feature_enabled;
	}
}
