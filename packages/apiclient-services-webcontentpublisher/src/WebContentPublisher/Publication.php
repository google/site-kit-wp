<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\WebContentPublisher;

class Publication extends \Google\Collection
{
  /**
   * Unspecified onboarding state.
   */
  public const ONBOARDING_STATE_ONBOARDING_STATE_UNSPECIFIED = 'ONBOARDING_STATE_UNSPECIFIED';
  /**
   * Action is required from the publisher to proceed with onboarding.
   */
  public const ONBOARDING_STATE_ACTION_REQUIRED = 'ACTION_REQUIRED';
  /**
   * Publication is pending an external verification step. No immediate action
   * is required.
   */
  public const ONBOARDING_STATE_PENDING_VERIFICATION = 'PENDING_VERIFICATION';
  /**
   * Onboarding is successfully completed.
   */
  public const ONBOARDING_STATE_COMPLETE = 'COMPLETE';
  /**
   * Unspecified payment option.
   */
  public const PAYMENT_OPTION_PAYMENT_OPTION_UNSPECIFIED = 'PAYMENT_OPTION_UNSPECIFIED';
  /**
   * No payment option configured.
   */
  public const PAYMENT_OPTION_NONE = 'NONE';
  /**
   * Publication supports paid subscriptions.
   */
  public const PAYMENT_OPTION_SUBSCRIPTIONS = 'SUBSCRIPTIONS';
  /**
   * Publication supports voluntary contributions.
   */
  public const PAYMENT_OPTION_CONTRIBUTIONS = 'CONTRIBUTIONS';
  /**
   * Unspecified publication type.
   */
  public const PUBLICATION_TYPE_PUBLICATION_TYPE_UNSPECIFIED = 'PUBLICATION_TYPE_UNSPECIFIED';
  /**
   * For-profit entity.
   */
  public const PUBLICATION_TYPE_FOR_PROFIT = 'FOR_PROFIT';
  /**
   * Non-profit entity.
   */
  public const PUBLICATION_TYPE_NON_PROFIT = 'NON_PROFIT';
  protected $collection_key = 'products';
  protected $additionalDomainsType = DomainProperty::class;
  protected $additionalDomainsDataType = 'array';
  protected $contentPolicyStatusType = ContentPolicyStatus::class;
  protected $contentPolicyStatusDataType = '';
  /**
   * Required. The user-visible display name of the publication.
   *
   * @var string
   */
  public $displayName;
  /**
   * Required. The primary language of the publication (BCP-47 code, e.g., "en-
   * US").
   *
   * @var string
   */
  public $languageCode;
  /**
   * Identifier. The resource name of the publication. Format:
   * organizations/{organization}/publications/{publication}
   *
   * @var string
   */
  public $name;
  /**
   * Output only. The current onboarding state.
   *
   * @var string
   */
  public $onboardingState;
  /**
   * Output only. The unique identifier of the organization that owns this
   * publication.
   *
   * @var string
   */
  public $organizationId;
  /**
   * Output only. The configured payment option.
   *
   * @var string
   */
  public $paymentOption;
  protected $primaryDomainType = DomainProperty::class;
  protected $primaryDomainDataType = '';
  /**
   * Output only. The list of active products/features enabled for this
   * publication.
   *
   * @var string[]
   */
  public $products;
  /**
   * Output only. The unique identifier of the publication.
   *
   * @var string
   */
  public $publicationId;
  /**
   * Optional. The URL to the publisher's Privacy Policy.
   *
   * @var string
   */
  public $publicationPrivacyPolicyUrl;
  /**
   * Optional. The URL to the publisher's own Terms of Service.
   *
   * @var string
   */
  public $publicationTosUrl;
  /**
   * Optional. The publication entity type (for-profit vs non-profit). Defaults
   * to FOR_PROFIT if omitted.
   *
   * @var string
   */
  public $publicationType;
  /**
   * Required. The ISO 3166-1 alpha-2 region code where the publication is
   * registered (e.g., "US").
   *
   * @var string
   */
  public $regionCode;
  protected $rrmProductType = RrmProduct::class;
  protected $rrmProductDataType = '';
  protected $slProductType = SlProduct::class;
  protected $slProductDataType = '';

  /**
   * Optional. Additional domain properties verified for the publication.
   *
   * @param DomainProperty[] $additionalDomains
   */
  public function setAdditionalDomains($additionalDomains)
  {
    $this->additionalDomains = $additionalDomains;
  }
  /**
   * @return DomainProperty[]
   */
  public function getAdditionalDomains()
  {
    return $this->additionalDomains;
  }
  /**
   * Output only. The content policy compliance status of the publication.
   *
   * @param ContentPolicyStatus $contentPolicyStatus
   */
  public function setContentPolicyStatus(ContentPolicyStatus $contentPolicyStatus)
  {
    $this->contentPolicyStatus = $contentPolicyStatus;
  }
  /**
   * @return ContentPolicyStatus
   */
  public function getContentPolicyStatus()
  {
    return $this->contentPolicyStatus;
  }
  /**
   * Required. The user-visible display name of the publication.
   *
   * @param string $displayName
   */
  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  /**
   * @return string
   */
  public function getDisplayName()
  {
    return $this->displayName;
  }
  /**
   * Required. The primary language of the publication (BCP-47 code, e.g., "en-
   * US").
   *
   * @param string $languageCode
   */
  public function setLanguageCode($languageCode)
  {
    $this->languageCode = $languageCode;
  }
  /**
   * @return string
   */
  public function getLanguageCode()
  {
    return $this->languageCode;
  }
  /**
   * Identifier. The resource name of the publication. Format:
   * organizations/{organization}/publications/{publication}
   *
   * @param string $name
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * Output only. The current onboarding state.
   *
   * Accepted values: ONBOARDING_STATE_UNSPECIFIED, ACTION_REQUIRED,
   * PENDING_VERIFICATION, COMPLETE
   *
   * @param self::ONBOARDING_STATE_* $onboardingState
   */
  public function setOnboardingState($onboardingState)
  {
    $this->onboardingState = $onboardingState;
  }
  /**
   * @return self::ONBOARDING_STATE_*
   */
  public function getOnboardingState()
  {
    return $this->onboardingState;
  }
  /**
   * Output only. The unique identifier of the organization that owns this
   * publication.
   *
   * @param string $organizationId
   */
  public function setOrganizationId($organizationId)
  {
    $this->organizationId = $organizationId;
  }
  /**
   * @return string
   */
  public function getOrganizationId()
  {
    return $this->organizationId;
  }
  /**
   * Output only. The configured payment option.
   *
   * Accepted values: PAYMENT_OPTION_UNSPECIFIED, NONE, SUBSCRIPTIONS,
   * CONTRIBUTIONS
   *
   * @param self::PAYMENT_OPTION_* $paymentOption
   */
  public function setPaymentOption($paymentOption)
  {
    $this->paymentOption = $paymentOption;
  }
  /**
   * @return self::PAYMENT_OPTION_*
   */
  public function getPaymentOption()
  {
    return $this->paymentOption;
  }
  /**
   * Required. The primary domain property associated with the publication.
   *
   * @param DomainProperty $primaryDomain
   */
  public function setPrimaryDomain(DomainProperty $primaryDomain)
  {
    $this->primaryDomain = $primaryDomain;
  }
  /**
   * @return DomainProperty
   */
  public function getPrimaryDomain()
  {
    return $this->primaryDomain;
  }
  /**
   * Output only. The list of active products/features enabled for this
   * publication.
   *
   * @param string[] $products
   */
  public function setProducts($products)
  {
    $this->products = $products;
  }
  /**
   * @return string[]
   */
  public function getProducts()
  {
    return $this->products;
  }
  /**
   * Output only. The unique identifier of the publication.
   *
   * @param string $publicationId
   */
  public function setPublicationId($publicationId)
  {
    $this->publicationId = $publicationId;
  }
  /**
   * @return string
   */
  public function getPublicationId()
  {
    return $this->publicationId;
  }
  /**
   * Optional. The URL to the publisher's Privacy Policy.
   *
   * @param string $publicationPrivacyPolicyUrl
   */
  public function setPublicationPrivacyPolicyUrl($publicationPrivacyPolicyUrl)
  {
    $this->publicationPrivacyPolicyUrl = $publicationPrivacyPolicyUrl;
  }
  /**
   * @return string
   */
  public function getPublicationPrivacyPolicyUrl()
  {
    return $this->publicationPrivacyPolicyUrl;
  }
  /**
   * Optional. The URL to the publisher's own Terms of Service.
   *
   * @param string $publicationTosUrl
   */
  public function setPublicationTosUrl($publicationTosUrl)
  {
    $this->publicationTosUrl = $publicationTosUrl;
  }
  /**
   * @return string
   */
  public function getPublicationTosUrl()
  {
    return $this->publicationTosUrl;
  }
  /**
   * Optional. The publication entity type (for-profit vs non-profit). Defaults
   * to FOR_PROFIT if omitted.
   *
   * Accepted values: PUBLICATION_TYPE_UNSPECIFIED, FOR_PROFIT, NON_PROFIT
   *
   * @param self::PUBLICATION_TYPE_* $publicationType
   */
  public function setPublicationType($publicationType)
  {
    $this->publicationType = $publicationType;
  }
  /**
   * @return self::PUBLICATION_TYPE_*
   */
  public function getPublicationType()
  {
    return $this->publicationType;
  }
  /**
   * Required. The ISO 3166-1 alpha-2 region code where the publication is
   * registered (e.g., "US").
   *
   * @param string $regionCode
   */
  public function setRegionCode($regionCode)
  {
    $this->regionCode = $regionCode;
  }
  /**
   * @return string
   */
  public function getRegionCode()
  {
    return $this->regionCode;
  }
  /**
   * Optional. Reader Revenue Manager product settings and status.
   *
   * @param RrmProduct $rrmProduct
   */
  public function setRrmProduct(RrmProduct $rrmProduct)
  {
    $this->rrmProduct = $rrmProduct;
  }
  /**
   * @return RrmProduct
   */
  public function getRrmProduct()
  {
    return $this->rrmProduct;
  }
  /**
   * Optional. Subscription Linking product configurations.
   *
   * @param SlProduct $slProduct
   */
  public function setSlProduct(SlProduct $slProduct)
  {
    $this->slProduct = $slProduct;
  }
  /**
   * @return SlProduct
   */
  public function getSlProduct()
  {
    return $this->slProduct;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Publication::class, 'Google_Service_WebContentPublisher_Publication');
