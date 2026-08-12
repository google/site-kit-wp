<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\Newsletter_Signup_CTA_Type_Handler
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA;

use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\NewsletterConfig;

/**
 * Configures newsletter sign-up CTA models.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Newsletter_Signup_CTA_Type_Handler implements CTA_Type_Handler_Interface {

	/**
	 * Gets the CTA type handled by this instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return string CTA type.
	 */
	public function get_type() {
		return Cta::TYPE_NEWSLETTER_SIGNUP;
	}

	/**
	 * Validates and applies newsletter configuration to a CTA model.
	 *
	 * @since n.e.x.t
	 *
	 * @param Cta   $cta    CTA model.
	 * @param array $config Newsletter configuration.
	 * @throws Invalid_Param_Exception Thrown if the configuration is invalid.
	 */
	public function configure_cta( Cta $cta, array $config ) {
		$allowed_fields = array(
			'title',
			'customMessage',
			'nameRequired',
			'customConsentText',
		);

		if ( array_diff( array_keys( $config ), $allowed_fields ) ) {
			throw new Invalid_Param_Exception( 'config' );
		}

		foreach ( array( 'title', 'customMessage', 'customConsentText' ) as $field ) {
			if ( array_key_exists( $field, $config ) && ! is_string( $config[ $field ] ) ) {
				throw new Invalid_Param_Exception( 'config' );
			}
		}

		if ( array_key_exists( 'nameRequired', $config ) && ! is_bool( $config['nameRequired'] ) ) {
			throw new Invalid_Param_Exception( 'config' );
		}

		$newsletter_config = new NewsletterConfig();

		if ( array_key_exists( 'title', $config ) ) {
			$newsletter_config->setTitle( $config['title'] );
		}

		if ( array_key_exists( 'customMessage', $config ) ) {
			$newsletter_config->setCustomMessage( $config['customMessage'] );
		}

		if ( array_key_exists( 'nameRequired', $config ) ) {
			$newsletter_config->setNameRequired( $config['nameRequired'] );
		}

		if ( array_key_exists( 'customConsentText', $config ) ) {
			$newsletter_config->setCustomConsentText( $config['customConsentText'] );
		}

		$cta->setType( $this->get_type() );
		$cta->setNewsletterConfig( $newsletter_config );
	}
}
