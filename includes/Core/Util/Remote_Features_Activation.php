<?php

namespace Google\Site_Kit\Core\Util;

class Remote_Features_Activation {
	use Method_Proxy_Trait;

	/**
	 * @var Remote_Features
	 */
	private $remote_features;

	private $features;

	public function __construct( Remote_Features $remote_features ) {
		$this->remote_features = $remote_features;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter( 'googlesitekit_is_feature_enabled', $this->get_method_proxy( 'filter_features' ), 10, 2 );
	}

	private function get_features() {
		if ( $this->features === null ) {
			$this->features = $this->remote_features->get();
		}

		return $this->features;
	}

	/**
	 * Filters feature flags using features stored in options.
	 *
	 * @since n.e.x.t
	 *
	 * @param boolean $feature_enabled Original value of the feature.
	 * @param string  $feature_name    Feature name.
	 * @return boolean State flag from options if it is available, otherwise the original value.
	 */
	private function filter_features( $feature_enabled, $feature_name ) {
		$features = $this->get_features();

		if ( isset( $features[ $feature_name ]['enabled'] ) ) {
			return filter_var( $features[ $feature_name ]['enabled'], FILTER_VALIDATE_BOOLEAN );
		}

		return $feature_enabled;
	}
}
