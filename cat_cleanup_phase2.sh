#!/bin/bash
WP_CMD="docker exec -u www-data climaticpro-wordpress-1 php wp-cli.phar"

# Function to merge categories
merge_cats() {
  OLD_ID=$1
  NEW_ID=$2
  OLD_SLUG=$3
  
  echo "---------------------------------------------------"
  echo "Merging Category ID $OLD_ID ($OLD_SLUG) -> Target ID $NEW_ID"
  
  # Get product IDs assigned to old category
  pids=$($WP_CMD post list --post_type=product --product_cat=$OLD_SLUG --field=ID --format=ids | tr '\n' ' ')
  
  if [ ! -z "$pids" ] && [ "$pids" != " " ]; then
      echo "Moving products..."
      for pid in $pids; do
          $WP_CMD post term add $pid product_cat $NEW_ID
      done
      echo "Successfully assigned new category."
      $WP_CMD term delete product_cat $OLD_ID
  else
      echo "No products found in category $OLD_SLUG. Deleting empty category..."
      $WP_CMD term delete product_cat $OLD_ID
  fi
}

echo "Starting Phase 2 Cleanup..."

# 1. Move BTU Categories to Aer Condiționat Rezidențial (515)
merge_cats 541 515 "aparate-aer-conditionat-12000-btu"
merge_cats 545 515 "aparate-aer-conditionat-18000-btu"
merge_cats 547 515 "aparate-aer-conditionat-24000-btu"
merge_cats 548 515 "aparate-aer-conditionat-7000-btu"
merge_cats 534 515 "aparate-aer-conditionat-9000-btu"

# 2. Move Specific Multi-Split to Aer Condiționat Rezidențial (515)
merge_cats 531 515 "aparate-aer-conditionat-dublusplit-cu-2-unitati"
merge_cats 542 515 "aparate-aer-conditionat-multisplit-cu-3-unitati-exterioare"

# 3. Move Duct/Caseta to Aer conditionat comercial (514)
merge_cats 526 514 "aer-conditionat-tip-duct-tip-caseta-coloana-si-pentru-pardoseala"

echo "---------------------------------------------------"
echo "Phase 2 Cleanup complete."
