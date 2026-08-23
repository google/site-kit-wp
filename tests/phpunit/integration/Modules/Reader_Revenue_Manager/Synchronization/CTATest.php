<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization\CTATest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\CTA;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta as WCP_CTA;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class CTATest extends TestCase {

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * CTA synchronization instance.
	 *
	 * @var CTA
	 */
	private $synchronization;

	public function set_up() {
		parent::set_up();

		$this->enable_feature( 'rrmExpressSetup' );

		$this->settings = new Settings(
			new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) )
		);
		$this->settings->register();
		$this->settings->set(
			array(
				'configuredCTAs' => array(
					'old-cta' => 'NEWSLETTER_SIGNUP',
				),
			)
		);

		$this->synchronization = new CTA( $this->settings );

		wp_clear_scheduled_hook( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );
	}

	public function tear_down() {
		wp_clear_scheduled_hook( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );

		parent::tear_down();
	}

	public function test_synchronize__updates_configured_ctas() {
		$this->synchronization->synchronize(
			array(
				$this->create_cta( 'organizations/1/publications/1/ctas/9d2418415-ab3a', 'NEWSLETTER_SIGNUP' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/8j8152411-cd4b', 'NEWSLETTER_SIGNUP' ),
				$this->create_cta( '', 'NEWSLETTER_SIGNUP' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/', 'NEWSLETTER_SIGNUP' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/7f1042311-ef5c', '' ),
				new \stdClass(),
			)
		);

		$this->assertSame(
			array(
				'9d2418415-ab3a' => 'NEWSLETTER_SIGNUP',
				'8j8152411-cd4b' => 'NEWSLETTER_SIGNUP',
			),
			$this->settings->get()['configuredCTAs'],
			'Configured CTAs should contain only valid ID-to-type entries.'
		);
	}

	public function test_synchronize__reschedules_cta_cron() {
		wp_schedule_single_event(
			time() + 600,
			CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS
		);
		$original_schedule = wp_next_scheduled( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );

		$this->synchronization->synchronize( array() );

		$new_schedule = wp_next_scheduled( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );

		$this->assertNotFalse( $new_schedule, 'Cron should remain scheduled.' );
		$this->assertNotSame( $original_schedule, $new_schedule, 'Cron should be rescheduled.' );
		$this->assertGreaterThanOrEqual( time() + HOUR_IN_SECONDS - 1, $new_schedule, 'Cron should run approximately one hour from now.' );
	}

	private function create_cta( $name = '', $type = '' ) {
		$cta = new WCP_CTA();
		$cta->setName( $name );
		$cta->setType( $type );

		return $cta;
	}
}
