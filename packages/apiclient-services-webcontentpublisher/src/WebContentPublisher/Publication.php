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

namespace Google\Service\Webcontentpublisher;

class Publication extends \Google\Collection
{
  public const ONBOARDING_STATE_ONBOARDING_STATE_UNSPECIFIED = 'ONBOARDING_STATE_UNSPECIFIED';
  public const ONBOARDING_STATE_ACTION_REQUIRED = 'ACTION_REQUIRED';
  public const ONBOARDING_STATE_PENDING_VERIFICATION = 'PENDING_VERIFICATION';
  public const ONBOARDING_STATE_COMPLETE = 'COMPLETE';
  public const PAYMENT_OPTION_PAYMENT_OPTION_UNSPECIFIED = 'PAYMENT_OPTION_UNSPECIFIED';
  public const PAYMENT_OPTION_NONE = 'NONE';
  public const PAYMENT_OPTION_SUBSCRIPTIONS = 'SUBSCRIPTIONS';
  public const PAYMENT_OPTION_CONTRIBUTIONS = 'CONTRIBUTIONS';

  protected $collection_key = 'products';
  protected $additionalDomainsType = DomainProperty::class;
  protected $additionalDomainsDataType = 'array';
  protected $contentPolicyStatusType = ContentPolicyStatus::class;
  protected $contentPolicyStatusDataType = '';
  /**
   * The user-visible display name of the publication.
   *
   * @var string
   */
  public $displayName;
  /**
   * The primary language code.
   *
   * @var string
   */
  public $languageCode;
  /**
   * The resource name of the publication.
   *
   * @var string
   */
  public $name;
  /**
   * The current onboarding state.
   *
   * @var string
   */
  public $onboardingState;
  /**
   * The organization identifier.
   *
   * @var string
   */
  public $organizationId;
  /**
   * The configured payment option.
   *
   * @var string
   */
  public $paymentOption;
  /**
   * The publication privacy policy URL.
   *
   * @var string
   */
  public $publicationPrivacyPolicyUrl;
  /**
   * The publication terms of service URL.
   *
   * @var string
   */
  public $publicationTosUrl;
  /**
   * The publication identifier.
   *
   * @var string
   */
  public $publicationId;
  protected $primaryDomainType = DomainProperty::class;
  protected $primaryDomainDataType = '';
  /**
   * Enabled products for the publication.
   *
   * @var string[]
   */
  public $products;
  /**
   * The ISO 3166-1 alpha-2 region code.
   *
   * @var string
   */
  public $regionCode;
  protected $rrmProductType = RrmProduct::class;
  protected $rrmProductDataType = '';
  protected $slProductType = SlProduct::class;
  protected $slProductDataType = '';

  public function setAdditionalDomains($additionalDomains)
  {
    $this->additionalDomains = $additionalDomains;
  }
  public function getAdditionalDomains()
  {
    return $this->additionalDomains;
  }
  public function setContentPolicyStatus(ContentPolicyStatus $contentPolicyStatus)
  {
    $this->contentPolicyStatus = $contentPolicyStatus;
  }
  public function getContentPolicyStatus()
  {
    return $this->contentPolicyStatus;
  }
  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  public function getDisplayName()
  {
    return $this->displayName;
  }
  public function setLanguageCode($languageCode)
  {
    $this->languageCode = $languageCode;
  }
  public function getLanguageCode()
  {
    return $this->languageCode;
  }
  public function setName($name)
  {
    $this->name = $name;
  }
  public function getName()
  {
    return $this->name;
  }
  public function setOnboardingState($onboardingState)
  {
    $this->onboardingState = $onboardingState;
  }
  public function getOnboardingState()
  {
    return $this->onboardingState;
  }
  public function setOrganizationId($organizationId)
  {
    $this->organizationId = $organizationId;
  }
  public function getOrganizationId()
  {
    return $this->organizationId;
  }
  public function setPaymentOption($paymentOption)
  {
    $this->paymentOption = $paymentOption;
  }
  public function getPaymentOption()
  {
    return $this->paymentOption;
  }
  public function setPublicationPrivacyPolicyUrl($publicationPrivacyPolicyUrl)
  {
    $this->publicationPrivacyPolicyUrl = $publicationPrivacyPolicyUrl;
  }
  public function getPublicationPrivacyPolicyUrl()
  {
    return $this->publicationPrivacyPolicyUrl;
  }
  public function setPublicationTosUrl($publicationTosUrl)
  {
    $this->publicationTosUrl = $publicationTosUrl;
  }
  public function getPublicationTosUrl()
  {
    return $this->publicationTosUrl;
  }
  public function setPublicationId($publicationId)
  {
    $this->publicationId = $publicationId;
  }
  public function getPublicationId()
  {
    return $this->publicationId;
  }
  public function setPrimaryDomain(DomainProperty $primaryDomain)
  {
    $this->primaryDomain = $primaryDomain;
  }
  public function getPrimaryDomain()
  {
    return $this->primaryDomain;
  }
  public function setProducts($products)
  {
    $this->products = $products;
  }
  public function getProducts()
  {
    return $this->products;
  }
  public function setRegionCode($regionCode)
  {
    $this->regionCode = $regionCode;
  }
  public function getRegionCode()
  {
    return $this->regionCode;
  }
  public function setRrmProduct(RrmProduct $rrmProduct)
  {
    $this->rrmProduct = $rrmProduct;
  }
  public function getRrmProduct()
  {
    return $this->rrmProduct;
  }
  public function setSlProduct(SlProduct $slProduct)
  {
    $this->slProduct = $slProduct;
  }
  public function getSlProduct()
  {
    return $this->slProduct;
  }
}

class_alias(Publication::class, 'Google_Service_Webcontentpublisher_Publication');
