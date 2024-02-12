<?php

namespace Google\Site_Kit\Core\Consent_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

class Consent_Mode {
	use Method_Proxy_Trait;

	/**
	 * @var Consent_Mode_Settings
	 */
	protected $consent_mode_settings;

	/**
	 * @var REST_Consent_Mode_Controller
	 */
	protected $rest_controller;

	public function __construct( Context $context, Options $options = null ) {
		$options = $options ?: new Options( $context );
		$this->consent_mode_settings = new Consent_Mode_Settings( $options );
		$this->rest_controller = new REST_Consent_Mode_Controller( $this->consent_mode_settings );
	}

	public function register() {
		$this->consent_mode_settings->register();
		$this->rest_controller->register();

		add_action( 'googlesitekit_gtag_before', $this->get_method_proxy( 'set_gtag_consent_default' ) );
	}

	protected function set_gtag_consent_default( $gtag ) {
		$settings = $this->consent_mode_settings->get();

		if ( ! $settings['enabled'] ) {
			return;
		}

		$gtag( 'consent', 'default', [
			'analytics_storage'  => 'denied',
			'ad_storage'         => 'denied',
			'ad_user_data'       => 'denied',
			'ad_personalization' => 'denied',
			'region'             => $settings['regions'],
		] );
	}
}
