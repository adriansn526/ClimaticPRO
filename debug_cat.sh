#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

echo "Fetching products in category 'banda-matisat'..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(where: { category: \"banda-matisat\" }) { nodes { name ... on SimpleProduct { attributes { nodes { name label options ... on GlobalProductAttribute { terms { nodes { name slug } } } } } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
