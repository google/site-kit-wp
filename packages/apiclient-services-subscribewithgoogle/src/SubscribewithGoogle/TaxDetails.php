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

class TaxDetails extends \Google\Model
{
  protected $amountType = Money::class;
  protected $amountDataType = '';
  /**
   * The tax category.
   *
   * @var string
   */
  public $taxCategory;

  /**
   * The amount of tax to collect.
   *
   * @param Money $amount
   */
  public function setAmount(Money $amount)
  {
    $this->amount = $amount;
  }
  /**
   * @return Money
   */
  public function getAmount()
  {
    return $this->amount;
  }
  /**
   * The tax category.
   *
   * @param string $taxCategory
   */
  public function setTaxCategory($taxCategory)
  {
    $this->taxCategory = $taxCategory;
  }
  /**
   * @return string
   */
  public function getTaxCategory()
  {
    return $this->taxCategory;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(TaxDetails::class, 'Google_Service_SubscribewithGoogle_TaxDetails');
