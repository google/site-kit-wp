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

namespace Google\Service\SubscribewithGoogle;

class Entitlement extends \Google\Collection
{
  protected $collection_key = 'products';
  /**
   * The resource name of the entitlement. Entitlement names have the form
   * `publications/{publication_id}/entitlements/{source}:{subscription_token}`.
   *
   * @var string
   */
  public $name;
  /**
   * A set of the publication's product IDs the user has access to. At least one
   * product is present and up to 20. This is the same product ID as can be
   * found in Schema.org markup (http://schema.org/productID).
   *
   * @var string[]
   */
  public $products;
  /**
   * Unique id for the reader shared externally. This field is to replace
   * user_id for better name.
   *
   * @var string
   */
  public $readerId;
  /**
   * The identifier of the entitlement source. It could be Google, or the
   * publication itself, or some other party in the future.
   *
   * @var string
   */
  public $source;
  /**
   * A source-specific subscription token. It's an opaque string that represents
   * the subscription at the source and it stays unchanged for the duration of
   * the subscription. This token is unique per a publication and a source
   * combination.
   *
   * @var string
   */
  public $subscriptionToken;
  /**
   * Unique id for the user shared externally.
   *
   * @deprecated
   * @var string
   */
  public $userId;

  /**
   * The resource name of the entitlement. Entitlement names have the form
   * `publications/{publication_id}/entitlements/{source}:{subscription_token}`.
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
   * A set of the publication's product IDs the user has access to. At least one
   * product is present and up to 20. This is the same product ID as can be
   * found in Schema.org markup (http://schema.org/productID).
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
   * Unique id for the reader shared externally. This field is to replace
   * user_id for better name.
   *
   * @param string $readerId
   */
  public function setReaderId($readerId)
  {
    $this->readerId = $readerId;
  }
  /**
   * @return string
   */
  public function getReaderId()
  {
    return $this->readerId;
  }
  /**
   * The identifier of the entitlement source. It could be Google, or the
   * publication itself, or some other party in the future.
   *
   * @param string $source
   */
  public function setSource($source)
  {
    $this->source = $source;
  }
  /**
   * @return string
   */
  public function getSource()
  {
    return $this->source;
  }
  /**
   * A source-specific subscription token. It's an opaque string that represents
   * the subscription at the source and it stays unchanged for the duration of
   * the subscription. This token is unique per a publication and a source
   * combination.
   *
   * @param string $subscriptionToken
   */
  public function setSubscriptionToken($subscriptionToken)
  {
    $this->subscriptionToken = $subscriptionToken;
  }
  /**
   * @return string
   */
  public function getSubscriptionToken()
  {
    return $this->subscriptionToken;
  }
  /**
   * Unique id for the user shared externally.
   *
   * @deprecated
   * @param string $userId
   */
  public function setUserId($userId)
  {
    $this->userId = $userId;
  }
  /**
   * @deprecated
   * @return string
   */
  public function getUserId()
  {
    return $this->userId;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Entitlement::class, 'Google_Service_SubscribewithGoogle_Entitlement');
