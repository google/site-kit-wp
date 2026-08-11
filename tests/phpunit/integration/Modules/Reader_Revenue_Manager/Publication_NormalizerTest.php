<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Publication_NormalizerTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\ContentPolicyStatus;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\DomainProperty;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\RrmProduct;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Publication_NormalizerTest extends TestCase {

	public function test_normalize() {
		$additional_domain = new DomainProperty();
		$additional_domain->setOwnershipVerified( true );
		$additional_domain->setUrl( 'https://other.example.com' );

		$primary_domain = new DomainProperty();
		$primary_domain->setOwnershipVerified( true );
		$primary_domain->setUrl( 'https://example.com' );

		$content_policy_status = new ContentPolicyStatus();
		$content_policy_status->setPolicyInfoUrl( 'https://example.com/policy' );
		$content_policy_status->setState( 'VIOLATION_ACTIVE' );

		$rrm_product = new RrmProduct();
		$rrm_product->setProductTosUrl( 'https://example.com/product-terms' );

		$publication = new Publication();
		$publication->setAdditionalDomains( array( $additional_domain ) );
		$publication->setContentPolicyStatus( $content_policy_status );
		$publication->setOnboardingState( 'COMPLETE' );
		$publication->setOrganizationId( 'organization-1' );
		$publication->setPaymentOption( 'SUBSCRIPTIONS' );
		$publication->setPrimaryDomain( $primary_domain );
		$publication->setProducts( array( 'basic', 'premium' ) );
		$publication->setPublicationId( 'publication-1' );
		$publication->setPublicationPrivacyPolicyUrl( 'https://example.com/privacy' );
		$publication->setPublicationTosUrl( 'https://example.com/terms' );
		$publication->setRegionCode( 'US' );
		$publication->setRrmProduct( $rrm_product );

		$normalized = Publication_Normalizer::normalize( $publication );

		$this->assertIsArray( $normalized, 'The normalized resource should be a plain array.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $normalized['onboardingState'], 'The onboarding state should use the legacy value.' );
		$this->assertSame( array( 'basic', 'premium' ), wp_list_pluck( $normalized['products'], 'name' ), 'Products should use the legacy resource shape.' );
		$this->assertTrue( $normalized['paymentOptions']['subscriptions'], 'The payment option should use the legacy object shape.' );
		$this->assertArrayNotHasKey( 'paymentOption', $normalized, 'The WCP payment option field should be replaced by its legacy alias.' );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_ACTIVE', $normalized['contentPolicyStatus']['contentPolicyState'], 'The content policy state should use the legacy key and value.' );
		$this->assertSame( 'https://example.com/policy', $normalized['contentPolicyStatus']['policyInfoLink'], 'The policy URL should use the legacy key.' );
		$this->assertArrayNotHasKey( 'state', $normalized['contentPolicyStatus'], 'The WCP content policy state field should be replaced by its legacy alias.' );
		$this->assertArrayNotHasKey( 'policyInfoUrl', $normalized['contentPolicyStatus'], 'The WCP policy URL field should be replaced by its legacy alias.' );
		$this->assertArrayNotHasKey( 'verifiedDomains', $normalized, 'Verified domains should not be normalized when they are not consumed.' );
		$this->assertSame( 'https://example.com', $normalized['primaryDomain']['url'], 'WCP domain fields should be preserved.' );
		$this->assertSame( 'https://other.example.com', $normalized['additionalDomains'][0]['url'], 'WCP domain fields should be preserved.' );
		$this->assertSame( 'organization-1', $normalized['organizationId'], 'New API fields should be preserved.' );
		$this->assertSame( 'US', $normalized['regionCode'], 'New API fields should be preserved.' );
		$this->assertSame( 'https://example.com/terms', $normalized['publicationTosUrl'], 'The publication ToS URL should be preserved.' );
		$this->assertSame( 'https://example.com/privacy', $normalized['publicationPrivacyPolicyUrl'], 'The privacy policy URL should be preserved.' );
		$this->assertSame( 'https://example.com/product-terms', $normalized['rrmProduct']['productTosUrl'], 'The product ToS URL should be preserved.' );
	}

	public function test_normalize__maps_ok_content_policy_state_to_legacy_value() {
		$content_policy_status = new ContentPolicyStatus();
		$content_policy_status->setState( 'OK' );

		$publication = new Publication();
		$publication->setContentPolicyStatus( $content_policy_status );

		$normalized = Publication_Normalizer::normalize( $publication );

		$this->assertSame(
			'CONTENT_POLICY_STATE_OK',
			$normalized['contentPolicyStatus']['contentPolicyState'],
			'The OK content policy state should use the legacy value.'
		);
	}
}
