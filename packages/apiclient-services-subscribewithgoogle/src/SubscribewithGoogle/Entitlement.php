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
   * @var string
   */
  public $name;
  /**
   * @var string[]
   */
  public $products;
  /**
   * @var string
   */
  public $readerId;
  /**
   * @var string
   */
  public $source;
  /**
   * @var string
   */
  public $subscriptionToken;
  /**
   * @var string
   */
  public $userId;

  /**
   * @param string
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
   * @param string[]
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
   * @param string
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
   * @param string
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
   * @param string
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
   * @param string
   */
  public function setUserId($userId)
  {
    $this->userId = $userId;
  }
  /**
   * @return string
   */
  public function getUserId()
  {
    return $this->userId;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Entitlement::class, 'Google_Service_SubscribewithGoogle_Entitlement');
