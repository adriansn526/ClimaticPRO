#!/bin/bash
WP_CMD="docker exec -u www-data climaticpro-wordpress-1 php wp-cli.phar"

# Function to merge categories by Slug
merge_slug() {
  BAD_SLUG=$1
  DEST_ID=$2
  
  echo "---------------------------------------------------"
  echo "Processing Bad Slug: $BAD_SLUG -> Target ID: $DEST_ID"
  
  # 1. Get ID of bad slug
  BAD_ID=$($WP_CMD term list product_cat --slug="$BAD_SLUG" --field=term_id --format=ids)
  
  if [ -z "$BAD_ID" ]; then
    echo "Category '$BAD_SLUG' not found. Skipping."
    return
  fi
  
  echo "Found ID: $BAD_ID"
  
  # 2. Get products
  pids=$($WP_CMD post list --post_type=product --product_cat=$BAD_SLUG --field=ID --format=ids | tr '\n' ' ')
  
  if [ ! -z "$pids" ] && [ "$pids" != " " ]; then
      echo "Moving products ($pids)..."
      for pid in $pids; do
          $WP_CMD post term add $pid product_cat $DEST_ID
      done
      echo "Products moved."
  else
      echo "No products in category."
  fi
  
  # 3. Delete bad category
  echo "Deleting category ID $BAD_ID..."
  $WP_CMD term delete product_cat $BAD_ID
  echo "Deleted."
}

echo "Starting Automated Cleanup..."

# Target: Aer Condiționat Rezidențial (515)
DEST_RES=515
merge_slug "aparate-aer-conditionat-9000-btu" $DEST_RES
merge_slug "aparate-aer-conditionat-12000-btu" $DEST_RES
merge_slug "aparate-aer-conditionat-18000-btu" $DEST_RES
merge_slug "aparate-aer-conditionat-24000-btu" $DEST_RES
merge_slug "aparate-aer-conditionat-7000-btu" $DEST_RES

merge_slug "aparate-de-aer-conditionat-multisplit" $DEST_RES
merge_slug "aparate-aer-conditionat-dublusplit-cu-2-unitati" $DEST_RES
merge_slug "aparate-aer-conditionat-multisplit-cu-3-unitati-exterioare" $DEST_RES
merge_slug "multi-split" $DEST_RES 
merge_slug "515" $DEST_RES # Accidental numbered category

# Target: Aer conditionat comercial (514)
DEST_COM=514
merge_slug "aer-conditionat-tip-duct-tip-caseta-coloana-si-pentru-pardoseala" $DEST_COM
merge_slug "514" $DEST_COM # Accidental numbered category

echo "---------------------------------------------------"
echo "Auto Cleanup Complete."
