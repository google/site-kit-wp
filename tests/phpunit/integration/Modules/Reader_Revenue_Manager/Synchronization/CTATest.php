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
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta as WCP_CTA;

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
					'old-cta' => array(
						'type'        => 'newsletter-signup',
						'state'       => 'ACTIVE',
						'displayName' => 'Old CTA',
					),
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
				$this->create_cta( 'organizations/1/publications/1/ctas/9d2418415-ab3a', 'NEWSLETTER_SIGNUP', 'ACTIVE', 'Weekly newsletter' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/8j8152411-cd4b', 'NEWSLETTER_SIGNUP', 'DRAFT' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/unknown-type', 'UNKNOWN_TYPE' ),
				$this->create_cta( '', 'NEWSLETTER_SIGNUP' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/', 'NEWSLETTER_SIGNUP' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/7f1042311-ef5c', '' ),
				new \stdClass(),
			)
		);

		$this->assertSame(
			array(
				'9d2418415-ab3a' => array(
					'type'        => 'newsletter-signup',
					'state'       => 'ACTIVE',
					'displayName' => 'Weekly newsletter',
				),
				'8j8152411-cd4b' => array(
					'type'        => 'newsletter-signup',
					'state'       => 'DRAFT',
					'displayName' => '',
				),
			),
			$this->settings->get()['configuredCTAs'],
			'Configured CTAs should contain only valid CTAs, each with its type, state and display name, and an empty display name when the CTA has none.'
		);
	}

	public function test_synchronize__stores_survey_ctas() {
		$this->synchronization->synchronize(
			array(
				$this->create_cta( 'organizations/1/publications/1/ctas/9d2418415-ab3a', 'NEWSLETTER_SIGNUP', 'ACTIVE', 'Weekly newsletter' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/5c3027196-gh6d', 'SURVEY', 'ACTIVE', 'Reader survey' ),
				$this->create_cta( 'organizations/1/publications/1/ctas/4b9016285-ij7e', 'SURVEY', 'DRAFT' ),
			)
		);

		$this->assertSame(
			array(
				'9d2418415-ab3a' => array(
					'type'        => 'newsletter-signup',
					'state'       => 'ACTIVE',
					'displayName' => 'Weekly newsletter',
				),
				'5c3027196-gh6d' => array(
					'type'        => 'survey',
					'state'       => 'ACTIVE',
					'displayName' => 'Reader survey',
				),
				'4b9016285-ij7e' => array(
					'type'        => 'survey',
					'state'       => 'DRAFT',
					'displayName' => '',
				),
			),
			$this->settings->get()['configuredCTAs'],
			'Survey CTAs should be stored with the survey type slug, alongside newsletter sign-up CTAs.'
		);
	}

	public function test_synchronize__updates_renamed_cta() {
		$cta_name = 'organizations/1/publications/1/ctas/9d2418415-ab3a';

		$this->synchronization->synchronize(
			array( $this->create_cta( $cta_name, 'NEWSLETTER_SIGNUP', 'ACTIVE', 'Weekly newsletter' ) )
		);
		$this->synchronization->synchronize(
			array( $this->create_cta( $cta_name, 'NEWSLETTER_SIGNUP', 'ACTIVE', 'Daily newsletter' ) )
		);

		$this->assertSame(
			'Daily newsletter',
			$this->settings->get()['configuredCTAs']['9d2418415-ab3a']['displayName'],
			'A renamed CTA should be stored with its new display name.'
		);
	}

	public function test_synchronize__reschedules_cta_cron() {
		wp_schedule_single_event(
			time() + 600,
			CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS
		);
		$original_schedule = wp_next_scheduled( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );

		$before = time();
		$this->synchronization->synchronize( array() );

		$new_schedule = wp_next_scheduled( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );

		$this->assertNotFalse( $new_schedule, 'Cron should remain scheduled.' );
		$this->assertNotSame( $original_schedule, $new_schedule, 'Cron should be rescheduled.' );
		$this->assertGreaterThanOrEqual( $before + HOUR_IN_SECONDS, $new_schedule, 'Cron should run approximately one hour from now.' );
	}

	private function create_cta( $name = '', $type = '', $state = 'ACTIVE', $display_name = null ) {
		$cta = new WCP_CTA();
		$cta->setName( $name );
		$cta->setType( $type );
		$cta->setState( $state );
		$cta->setDisplayName( $display_name );

		return $cta;
	}
}
